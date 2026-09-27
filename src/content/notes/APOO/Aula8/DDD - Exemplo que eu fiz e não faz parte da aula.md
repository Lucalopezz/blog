# DDD com NestJS e Java/Spring — exemplo que eu fiz e não faz parte da aula

> Esta nota não faz parte da aula de DDD. Eu a fiz para exemplificar a organização das camadas em projetos com NestJS e Java/Spring.

## Exemplo com NestJS

In NestJS, I’d keep the same DDD separation, just adapted to Nest conventions.

A good structure would be:

```text
src/
└── users/
    ├── application/
    │   ├── use-cases/
    │   │   ├── create-user.use-case.ts
    │   │   ├── get-user.use-case.ts
    │   │   ├── update-user.use-case.ts
    │   │   └── delete-user.use-case.ts
    │   │
    │   └── dto/
    │       ├── create-user.input.ts
    │       └── user.output.ts
    │
    ├── domain/
    │   ├── entities/
    │   │   └── user.entity.ts
    │   │
    │   ├── value-objects/
    │   │   ├── email.vo.ts
    │   │   └── user-id.vo.ts
    │   │
    │   ├── repositories/
    │   │   └── user.repository.ts
    │   │
    │   ├── services/
    │   │   └── user-domain.service.ts
    │   │
    │   └── events/
    │       └── user-created.event.ts
    │
    ├── infrastructure/
    │   └── persistence/
    │       └── prisma/
    │           ├── prisma-user.repository.ts
    │           └── user.mapper.ts
    │
    ├── presentation/
    │   └── http/
    │       ├── users.controller.ts
    │       ├── dto/
    │       │   └── create-user.request.ts
    │       └── presenters/
    │           └── user.presenter.ts
    │
    └── users.module.ts
```

This preserves the same idea from your class: presentation receives requests, application orchestrates the use case, domain contains the business model, and infrastructure handles persistence details.

For example, your domain entity should not depend on NestJS:

```ts
export class User {
  constructor(
    public readonly id: UserId,
    private name: string,
    private email: Email,
  ) {}

  changeName(name: string) {
    if (!name.trim()) {
      throw new Error('Invalid name');
    }

    this.name = name;
  }

  getName() {
    return this.name;
  }

  getEmail() {
    return this.email;
  }
}
```

Notice: no `@Injectable()`, no Prisma, no `@Entity()`, no Nest stuff.

The repository interface also stays in the domain:

```ts
export abstract class UserRepository {
  abstract findById(id: UserId): Promise<User | null>;
  abstract findByEmail(email: Email): Promise<User | null>;
  abstract save(user: User): Promise<void>;
}
```

You could also use a TypeScript interface:

```ts
export interface UserRepository {
  findById(id: UserId): Promise<User | null>;
  save(user: User): Promise<void>;
}
```

But in Nest, an `abstract class` is often more convenient because Nest DI needs a runtime token. Interfaces disappear after TypeScript compilation.

Then the application use case:

```ts
@Injectable()
export class CreateUserUseCase {
  constructor(
    private readonly userRepository: UserRepository,
  ) {}

  async execute(input: CreateUserInput) {
    const email = new Email(input.email);

    const existing = await this.userRepository.findByEmail(email);

    if (existing) {
      throw new Error('User already exists');
    }

    const user = new User(
      UserId.create(),
      input.name,
      email,
    );

    await this.userRepository.save(user);

    return user;
  }
}
```

This is your Application Service/use case: it coordinates repository + domain, but business rules should ideally remain in entities, VOs, or domain services when they are truly domain rules. That matches the class material.

With Prisma, infrastructure would contain the implementation:

```ts
@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(
    private readonly prisma: PrismaService,
  ) {}

  async findById(id: UserId): Promise<User | null> {
    const raw = await this.prisma.user.findUnique({
      where: {
        id: id.value,
      },
    });

    if (!raw) {
      return null;
    }

    return UserMapper.toDomain(raw);
  }

  async save(user: User): Promise<void> {
    const data = UserMapper.toPersistence(user);

    await this.prisma.user.upsert({
      where: {
        id: data.id,
      },
      create: data,
      update: data,
    });
  }
}
```

And the mapper is useful because your Prisma model and domain model do not have to be the same object:

```ts
export class UserMapper {
  static toDomain(raw: PrismaUser): User {
    return new User(
      new UserId(raw.id),
      raw.name,
      new Email(raw.email),
    );
  }

  static toPersistence(user: User) {
    return {
      id: user.id.value,
      name: user.getName(),
      email: user.getEmail().value,
    };
  }
}
```

Then the controller stays thin:

```ts
@Controller('users')
export class UsersController {
  constructor(
    private readonly createUser: CreateUserUseCase,
  ) {}

  @Post()
  async create(@Body() body: CreateUserRequest) {
    const user = await this.createUser.execute({
      name: body.name,
      email: body.email,
    });

    return UserPresenter.toHttp(user);
  }
}
```

The controller should basically do:

```text
HTTP
 ↓
validate request
 ↓
call use case
 ↓
convert result to HTTP response
```

Not:

```text
Controller
 ├── validates business rules
 ├── calls Prisma directly
 ├── builds entities
 └── contains SQL logic
```

Your `users.module.ts` is where Nest wires everything together:

```ts
@Module({
  controllers: [
    UsersController,
  ],

  providers: [
    CreateUserUseCase,

    {
      provide: UserRepository,
      useClass: PrismaUserRepository,
    },
  ],
})
export class UsersModule {}
```

This part is especially important. Nest's DI container becomes your composition root:

```text
CreateUserUseCase
       ↓
 UserRepository
       ↑
       │ Nest injects
       │
PrismaUserRepository
       ↓
    Prisma
       ↓
 PostgreSQL
```

That directly follows the dependency inversion idea from your material: application/domain depend on an abstraction, while infrastructure provides the concrete implementation.

One thing I'd avoid is the typical Nest structure:

```text
users/
├── users.controller.ts
├── users.service.ts
├── users.repository.ts
├── user.entity.ts
└── users.module.ts
```

It's fine for a CRUD, but as the domain grows, `UsersService` tends to become:

```ts
class UsersService {
  create()
  update()
  remove()
  findAll()
  findOne()
  changePassword()
  activate()
  deactivate()
  verifyEmail()
  resetPassword()
  ...
}
```

With DDD/application use cases, you get:

```text
application/
├── create-user.use-case.ts
├── change-user-email.use-case.ts
├── deactivate-user.use-case.ts
├── activate-user.use-case.ts
└── get-user.use-case.ts
```

Much easier to reason about and test.

For NestJS specifically, I’d recommend this final structure:

```text
src/
├── users/
│   ├── application/
│   │   ├── use-cases/
│   │   └── dto/
│   │
│   ├── domain/
│   │   ├── entities/
│   │   ├── value-objects/
│   │   ├── repositories/
│   │   ├── services/
│   │   └── events/
│   │
│   ├── infrastructure/
│   │   └── persistence/
│   │       └── prisma/
│   │
│   ├── presentation/
│   │   └── http/
│   │
│   └── users.module.ts
│
├── shared/
│   ├── infrastructure/
│   │   └── database/
│   │       ├── prisma.service.ts
│   │       └── prisma.module.ts
│   │
│   └── domain/
│       └── ...
│
├── app.module.ts
└── main.ts
```

And I would keep Prisma itself in something like:

```text
shared/infrastructure/database/
```

because Prisma is not conceptually part of `users`; it is infrastructure used by multiple modules.

So the clean mental model is:

```text
users.module.ts
      │
      ├── presentation
      │       ↓
      │   Controller
      │
      ├── application
      │       ↓
      │    Use Cases
      │
      ├── domain
      │       ↓
      │ Entity / VO / Repository interface
      │
      └── infrastructure
              ↓
         Prisma repository
              ↓
           Database
```

That structure fits NestJS very naturally while remaining faithful to the DDD model from your class.

## Exemplo com Java/Spring

Yes — your division is basically correct, and it matches the layered DDD model from your class: Presentation → Application → Domain → Infrastructure. The important correction is that I would **not put the controller directly under `infra` conceptually**. In the material, controllers/endpoints belong to the **presentation layer**, while infrastructure is for technical details such as ORM, database, messaging, external APIs, etc.

A clean `users` module could look like this:

```text
users/
├── application/
│   ├── usecases/
│   │   ├── CreateUserUseCase.java
│   │   ├── UpdateUserUseCase.java
│   │   ├── GetUserUseCase.java
│   │   └── DeleteUserUseCase.java
│   │
│   └── dto/
│       ├── CreateUserInput.java
│       └── UserOutput.java
│
├── domain/
│   ├── entities/
│   │   └── User.java
│   │
│   ├── valueobjects/
│   │   ├── Email.java
│   │   └── UserId.java
│   │
│   ├── repositories/
│   │   └── UserRepository.java
│   │
│   ├── services/
│   │   └── UserDomainService.java
│   │
│   ├── events/
│   │   └── UserCreated.java
│   │
│   └── factories/
│       └── UserFactory.java
│
├── infrastructure/
│   └── persistence/
│       ├── JpaUserRepository.java
│       ├── UserJpaEntity.java
│       └── UserMapper.java
│
└── presentation/
    └── http/
        ├── UserController.java
        ├── request/
        │   └── CreateUserRequest.java
        └── response/
            └── UserResponse.java
```

The responsibilities would be approximately:

```text
presentation
    ↓
receives HTTP request

application
    ↓
orchestrates the use case

domain
    ↓
contains the business model and rules

infrastructure
    ↓
implements technical details
```

That follows the class material quite closely: the application layer coordinates a use case without owning the core business rules, while the domain contains entities, VOs, aggregates, domain services and events.

### `application/` → use cases

Yes.

For example:

```java
public class CreateUserUseCase {

    private final UserRepository repository;

    public CreateUserUseCase(UserRepository repository) {
        this.repository = repository;
    }

    public User execute(CreateUserInput input) {

        User user = new User(
            new UserId(),
            input.name(),
            new Email(input.email())
        );

        repository.save(user);

        return user;
    }
}
```

This is basically what your class calls an **Application Service**: it represents/orchestrates a system use case.

So these are effectively equivalent organizational ideas:

```text
application/
    services/
        UserService.java
```

or:

```text
application/
    usecases/
        CreateUserUseCase.java
        UpdateUserUseCase.java
```

I personally prefer **one class per use case**, because the responsibility becomes much clearer:

```text
CreateUserUseCase
UpdateUserUseCase
DeleteUserUseCase
FindUserUseCase
```

instead of eventually getting:

```text
UserService.java
    create()
    update()
    delete()
    changeEmail()
    resetPassword()
    activate()
    deactivate()
    ...
```

That tends to become a huge class.

---

### `domain/` → entities, VOs and repository interfaces

Exactly.

```text
domain/
├── entities/
├── valueobjects/
├── repositories/
├── services/
├── factories/
└── events/
```

The important rule is:

> **Domain must not know which ORM or database exists.**

Your class explicitly presents the repository this way: the abstraction/interface can live in the domain, while the concrete implementation belongs in infrastructure.

For example:

```java
public interface UserRepository {

    Optional<User> findById(UserId id);

    Optional<User> findByEmail(Email email);

    void save(User user);

    void delete(User user);
}
```

Notice that there is no:

```java
JpaRepository
EntityManager
Hibernate
PostgreSQL
```

there.

The domain shouldn't care.

---

### `infrastructure/` → implementation details

Yes.

For example:

```text
infrastructure/
└── persistence/
    └── jpa/
        ├── JpaUserRepository.java
        ├── UserJpaEntity.java
        └── UserMapper.java
```

Something like:

```java
public class JpaUserRepository
        implements UserRepository {

    private final SpringDataUserRepository repository;

    @Override
    public void save(User user) {
        UserJpaEntity entity =
            UserMapper.toEntity(user);

        repository.save(entity);
    }
}
```

This is exactly the dependency inversion shown in the material:

```text
CreateUserUseCase
        ↓
UserRepository
        ↑
JpaUserRepository
        ↓
PostgreSQL
```

So the application/domain depends on the **abstraction**, not on JPA. The concrete repository depends on that abstraction.

---

### About the controller

This is the one part I'd separate from your original idea.

You suggested:

```text
user/infra
    repository implementation
    controller
```

It can work technically, and many Clean Architecture projects call everything external "infrastructure", but **following your professor's class model**, I'd prefer:

```text
users/
├── presentation/
│   └── UserController.java
│
├── application/
├── domain/
└── infrastructure/
```

because the material explicitly lists:

```text
Presentation
    Controllers
    Views
    Endpoints
```

while infrastructure contains things like:

```text
database
ORM
HTTP integration
messaging
email
external APIs
persistence
```

The flow then becomes very easy to reason about:

```text
POST /users
    │
    ▼
UserController
    │
    ▼
CreateUserUseCase
    │
    ├── creates/manipulates → User
    │                         Email
    │                         UserId
    │
    ▼
UserRepository
    ▲
    │ implements
JpaUserRepository
    │
    ▼
PostgreSQL
```

And that is almost identical to the typical flow shown at the end of your material: request → presentation → application service → domain → repository → infrastructure/database.

One other detail that matters for your class: **you normally want a repository per aggregate root, not necessarily per entity**. If `User` is an Aggregate Root containing things like `Email`, `Address`, etc., you'd normally have `UserRepository`, not `EmailRepository` or `AddressRepository`.

So for a Java/Spring project based specifically on this class, I'd settle on:

```text
users/
├── application/
│   ├── usecases/
│   └── dto/
│
├── domain/
│   ├── entities/
│   ├── valueobjects/
│   ├── repositories/
│   ├── services/
│   ├── factories/
│   └── events/
│
├── infrastructure/
│   └── persistence/
│       └── jpa/
│
└── presentation/
    └── http/
```

That gives you a very good separation without overcomplicating the project.
