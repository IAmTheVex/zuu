<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

Zuu is a web framework for the backend! Written in TypeScript and running on the NodeJS platform, it inspires beautiful and declarative code!

It aims at providing the developer with all the tools needed to make a very powerful app using mainly declarative code. Just tell the framework what to do and when... don't worry about how it's done. It's mainly oriented on the API pattern but it can also do MVC.

It's based arround a powerful reflection API (@zuu/mirror) written to acomodate the new Metadata API is ESNext and the Decorators that TypeScript provides early access to!

The core components of Zuu are:
1) Mirror: Powerful reflection API for typescript
2) Vet: Comon components (DI, Configuration, Runtime management, Event bus and more)
3) Mink: Routing and serving
4) Ferret: ORM (fork of typeorm)
5) Owl: Nightly juicy add-on for Mink that provides GraphQL bindings

See more info about each down below. Also check the repo's `packages` directory for detailed information!

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>

# @zuu/mirror

## What is Mirror?
Mirror is a very powerfull reflection api created for typescript, mainly used with the zuu framework (for dependency injection, assertion and other cool stuff).

## Usage
The basic principle is easy. Decorations are attached to ```classes, properties, methods and method parameters``` and can be reflected after by a very powerfull reflection engine (that also provides aditional information about the types, names, positions, etc).

The first step is to create a new decoration:
```typescript
// just extend the IDecoration interface
interface GParameters extends IDecoration {
    x: number;
    y?: string;
};
```
After that we can define our decorator logic:
```typescript
// just extend the AbstractDecorator<T> and provide a IDecoration type
class GDecorator extends AbstractDecorator<GParameters> {
    constructor() {
        // provide information about the MirrorType [CLASS, PROPERTY, METHOD, PARAMETER] and a namespace (must be unique)
        super(MirrorType.CLASS, "demos.class.g");
    };

    public annotate(instance: GParameters, target: any, key?: string | symbol, index?: number) {
        // here you can process your decoration placement
        console.log(instance);
    };
};
```
Now we can ask mirror to build our decorator: (don't forget to say please)
```typescript
// Hey Mirror, sorry for bothering you, but can you please make a new decorator?
//  It will be a ClassDecorator and will bind to GParameters decoration :) Thanks
let G = Mirror.decorator<GParameters, ClassDecorator>(new GDecorator);
```
That's all :) Now you can use it on any class like so:
```typescript
@G({x: 3, y: "abcd"})
class Dummy { };
```
It's a decorator factory actually... but you can convert it to a decorator just by calling it with the decoration:
```typescript
let g = G({x: 0});

@g
class Dummy2 {};
```
You can now reflect on your class or class instances (also on specific methods and properties):
```typescript
let reflection: ReflectedClass = Mirror.reflect<ReflectedClass>(Dummy);
console.log(reflection);

let instance = new Dummy2()
let instanceReflection: ReflectedClass = Mirror.reflectInstance<ReflectedClass>(instance);
console.log(instanceReflection);
```

## Objects
| Object | Reflection | Decorator |
|:------ |:----------:| ---------:|
| type | `ReflectedType` | `-` |
| class | `ReflectedClass` | `ClassDecorator` |
| property | `ReflectedProperty` | `PropertyDecorator` |
| method | `ReflectedMethod` | `MethodDecorator` |
| parameter | `ReflectedParameter` | `ParamterDecorator` |

# @zuu/vet

## What is Vet?
Vet is a component of the Zuu framework designed to provide all the commons needed.

## Quick intro
The vet in a zoo is like a... umm.... Whatever! Vet contains everything that all the other ~~ainmals~~ packages might need. This includes a global framework wide Event Bus with all the events handlers, custom events, customs local wide Event buses, configuration managers and configuration injectors, dependency injection, namespacing and scoping (ex: Singleton patterns already covered), debugging, debugger tags and log streams, async runtime management and long lasting tasks also, time tools, string formating tools, platform tools and other small tools.

## Runtime
You can run a scoped async task using:
```typescript
Runtime.scoped(null, async _ => {
    
});
```
`Runtime.scoped` runs an async task in a scope (in this case `null`) and it returns a `Promise` that resolves when the task returns.

## Events
The events system consists of a `EventBus`, the `AbstractEvent` and the `AbstractEventListener<T>`. There is also a global instance of `EventBus` used for framework wide event listening.

## Debugging
The Debugger connects to the Event Bus and emits `LogEvent`s and `ErrorEvent`s via the static methods that is provides `Debugger.log` and `Debugger.error`. Vet provides some default event listeners for the Debugger events that emmit the event to the `STDOUT` and `STDERR`. You can register those listeners using `Debugger.defaults` static method.

 It also provides log tags that act like template strings fromatters (check typescript docs for more ;)) to add metadata to your logs streams. For example the next snippet:
```typescript
Debugger.defaults();
let tag = Debugger.tag('tag-tag-tag');

let randomValue = 1298304;
Debugger.log(tag`Here's a random value: ${randomValue}!`);
```
produces the following output:
```
(tag-tag-tag): Here's a random value: 1298304!
```

## Dependency injection
Vet is onored to present to you, the world simplest Dependency Injection Container and tooling. No need to specify the providers (you can if you want...), no need to specify the scopes (you can if you want...), only specify where you want your dependency to be injected using the ```@Inject``` decorator and it will automagically lazy load (will be provided only when needed) your dependency. 

For example this script
```typescript
class NeededResource1 {
    private tag = Debugger.tag('needed-resource-1');

    public log() {
        Debugger.log(this.tag`Used!`);        
    }
};

class NeededResource2 {
    private tag = Debugger.tag('needed-resource-2');

    @Inject private resource: NeededResource1;

    public log() {
        this.resource.log();
        Debugger.log(this.tag`Used!`);        
    }
};

class User {
    @Inject private resource: NeededResource2;

    public demo() {
        this.resource.log();
    }
};

new User().demo();
```
produces the following output
```
(needed-resource-1): Used!
(needed-resource-2): Used!
```
As you can see it creates the resources even if they are nested!

Also you can scope resources! Vet comes out of the box with one scope: Singleton. You can use a scope like so:
```typescript
@Singleton
class NeededResource {
    private static count: number = 0;

    private tag = Debugger.tag('needed-resource');

    constructor() {
        Debugger.log(this.tag`Constructed! ${NeededResource.count}`);
        NeededResource.count ++;
    }

    public log() {
        Debugger.log(this.tag`Used!`);        
    }
};

class User {
    @Inject private resource1: NeededResource;
    @Inject private resource2: NeededResource;

    public demo() {
        this.resource1.log();
        this.resource2.log();
    }
};

new User().demo();
```
The sscript above produces the following output
```
(needed-resource): Constructed! 0
(needed-resource): Used!
(needed-resource): Used!
```

## Configuration
Vet's configuration is an subcase of the dependency injector. It finds, caches and auto reloads the configurations needed. The onfiguration files need to have a JSON format and the `.config.json` extension. They can be placed anywhere in the project structure! For example to load the config from `app.config.json` you can use:
```typescript
class X {
    @Configuration('app') private config: any;
}
```
If you want to autoreload the config when changes occur, you can pass `true` as the second parameter to the `@configuration` decorator.

Vet also provides a `ConfigurationManager` class used to extract, cache, invalidate, inflate and parse configurations. It can also extract the configuration values from the env using `@Configuration('$env')`.

# @zuu/mink 

## What is Mink?
Mink is.. AMAZING!!! No... For real now... It's a component of the Zuu framework responsable for the routing and the setup of the server (has drivers for express, koa and hapi). Also dows some sweet websocket stuff (baking service for OWL Subscriptions) :)

Mink calls the smallest unit of organization a `Controller`.

## Controllers

```typescript
@Controller()
export class ResourceController {

    @Get("/resources")
    getAll() {
       return "This shows all the resources";
    }

    @Get("/resources/:id")
    getOne(@Param("id") id: number) {
       return "This action returns resource with is " + id;
    }

    @Post("/resources")
    post(@Body() resource: any) {
       return "New resource...";
    }

    @Delete("/users/:id")
    remove(@Param("id") id: number) {
       return "Deleting resource...";
    }

    @Put("/resources/:id")
    put(@Param("id") id: number, @Body() resource: any) {
       return "Patching a resource...";
    }
}
```
This class will notify the framwork to register all the routes exposed here.

### JSON is gold
When designing a REST API, and JSON is the language that your API speaks (requests come in with application/json content type and leave with application/json content type), you can use `@JsonController` instead of `@Controller` and the framework will take care of the rest for the JSON parsing for you!
```typescript
@JsonController()
export class ResourceController {
    @Get("/resources")
    getAll() {
       return Database.resources.getAllSync();
    }
}
```
### Async world
When working with databases, more than often you will need to wait for it to return results, action that CAN'T be blocking! Do database interaction async! Your methods inside a controller can return a promise and the framework will wait for it to resolve before sending the response. This way, you can make `async` methods and use `await` without worries! It's not a blocking operation, you won't loose time on IO (like PHP did a long time ago).
```typescript
@JsonController()
export class ResourceController {
    @Get("/resources")
    async getAll() {
       return await Database.resources.getAllAsync();
    }
}
```
### Prefixing controllers
You can use the parameter from the `@Controller` decorator if you want to prefix all the routes.
```typescript
@Controller("/resources")
export class ResourceController {

}
```
### Injectables
In any `Action` method you can inject some objects from the framework.
- Request and response objects
```typescript
@Get("/resources")
getAll(@Req() request: any, @Res() response: any) {
    return response.send("Hi!");
}
```
If you are using koa, you can also inject the context using `@Ctx`.

- Routing parameters
```typescript
@Get("/resources/:id")
getOne(@Param("id") id: number) {
    
}
```
You can use `@Params` if you want to inject all the parameters as an object, but no validation will apply.

- Query parameters (?x=....&y=...)
```typescript
@Get("/resources")
getResources(@QueryParam("limit") limit: number) {

}
```
You can use `@QueryParams` if you want to inject all the query parameters as an object, but no validation will apply.

- Inject body parameters (only when applies: POST/PATCH requests)
```typescript
@Post("/resources")
saveUser(@BodyParam("name") resourceName: string) {

}
```
You can use `@Body` if you want to inject the entire body. You can apply validations if you provide a type: `@Body() user: UserType`. `UserType` may have `class-validator` decorators on it.

- Inject headers
```typescript
@Post("/resources")
saveResource(@HeaderParam("auth") key: string) {

}
```
You can use `@HeaderParams` if you want to inject all the headers instead of only one.

- Inject cookie parameters
```typescript
@Post("/resources")
saveResource(@CookieParam("name") name: string) {

}
```
You can use `@CookieParams` if you want to inject all the cookies instead of only one.

- Inject session parameters
```typescript
@Post("/resources")
saveResource(@SessionParam("name") name: string) {

}
```
You can use `@SessionParams` if you want to inject the entire session.

- Inject uploaded files
```typescript
@Post("/resources")
saveResource(@UploadedFile("fileName") file: File) {

}
```
You can use `@UploadedFiles` if you want to inject all the uploaded files as an object. You can also provide options for `Multer`.


Every parameter can be made required (the framework will throw an exception if it's missing) usgin `{ required: true }` in the options object of each decorator.

### Custom headers
- Custom content type
```typescript
@Get("/resources")
@ContentType("text/cvs")
getResources() {

}
```

- Custom location
```typescript
@Get("/resources")
@Location("http://github.com")
getResources() {

}
```

- Redirect
```typescript
@Get("/resources")
@Redirect("http://github.com")
getResources() {

}
```

You can use template url for the redirects
```typescript
@Get("/resources")
@Redirect("http://github.com/:owner/:repo")
getResources() {
    return {
        owner: "IAmTheVex",
        repo: "zuu"
    };
}
```

- HTTP response code
```typescript
@HttpCode(268)
@Get("/resources")
getResources() {

}
```

- Other headers
```typescript
@Get("/resources/:id")
@Header("x-stick-session", "no")
getOne(@Param("id") id: number) {

}
```

### Other Actions
- Rendering
```typescript
@Get("/")
@Render("home")
index() {
    return {
        firstName: "ABCD",
        lastName: "DEFG"
    };
}
```

- Throwing errors
```typescript
@Get("/user/:id")
findOne(@Param("id") id: number) {
    const user = await Databse.users.findOneById(id);
    if (!user)
        throw new NotFoundError(`User was not found.`);

    return user;
}
```
There are set of prepared errors you can use:
1) HttpError
2) BadRequestError
3) ForbiddenError
4) InternalServerError
5) MethodNotAllowedError
6) NotAcceptableError
7) NotFoundError
8) UnauthorizedError

You can also make custom errors extending the `HttpError` class.

## Middlewares
You can use any existing express / koa middleware, or create your own. To create your middlewares there is a `@Middleware` decorator, and to use already exist middlewares there are `@UseBefore` and `@UseAfter` decorators.

### Existing middleware
1) Make sure you have the middleware package installed: `npm install compression`
2) Use the middleware per action:
```typescript
@Get("/resources/:id")
@UseBefore(compression())
getOne(@Param("id") id: number) {

}
```
This way `compression` middleware will be applied only for `getOne` controller action, and will be executed before action execution. To execute middleware after action use `@UseAfter` decorator instead.

3) Use the middleware per controller:
```typescript
@Controller()
@UseBefore(compression())
export class ResourceController {

}
```
This way compression middleware will be applied for all actions of the `ResourceController` controller, and will be executed before its action execution. Same way you can use `@UseAfter` decorator here.

4) You can also use a middleware globally

### Create your own middleware
```typescript
export class DemoMiddleware implements ExpressMiddlewareInterface {
    use(request: any, response: any, next?: (err?: any) => any): any {
        // .........
        next(); // don't forget to call next
    }
}
```

If you want to use the middleware globally, you also have to annotate it with `@Middleware`.

### Error handlers
```typescript
@Middleware({ type: "after" })
export class CustomErrorHandler implements ExpressErrorMiddlewareInterface {
    error(error: any, request: any, response: any, next: (err: any) => any) {
        // .........
        next(); // don't forget to call next
    }

}
```

## Interceptors
Interceptors are like middlewares but for the final stage of the processing. After the middleware or the action responds to the request it calls the interceptor. You can use an interceptor using `@UseInterceptor` or globally if the interceptor class is anotated with `@Interceptor`.
```typescript
@Interceptor()
export class UselessInterceptor implements InterceptorInterface {
    intercept(action: Action, content: any) {
        return content;
    }
}
```

## Authorization features
You can check if the user is authorized to use an action anotating a method with the `@Authorized(roles)` decorator. The roles will be checked using your declared `AuthorizationChecker` [see @zuu/bootstrap] and if it doesn't have access, `UnauthorizedError` will be thrown.

You can also inject the current user using `@CurrentUser` provided by your `CurrentUserChecker` [also see @zuu/bootstrap].
```typescript
@JsonController()
export class RandomController {
    @Authorized("ADMIN")
    @Post("/update_stuff")
    update(@CurrentUser() user: User, @Body() stuff: any) {
        // we can guarantee that the user is an admin
        let admin: Admin = <Admin>(<any>user); // so we can hardcast it!
    
    }
}
```

## Decorators

#### Controller Decorators

| Signature                            | Example                                              | Description                                                                                                                                                                                                                                                                                                                                                                                                                                          |
|--------------------------------------|------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|
| `@Controller(baseRoute: string)`     | `@Controller("/users") class SomeController`         | Class that is marked with this decorator is registered as controller and its annotated methods are registered as actions. Base route is used to concatenate it to all controller action routes.                                                                                                                                                                                                                                                      |
| `@JsonController(baseRoute: string)` | `@JsonController("/users") class SomeJsonController` | Class that is marked with this decorator is registered as controller and its annotated methods are registered as actions. Difference between @JsonController and @Controller is that @JsonController automatically converts results returned by controller to json objects (using JSON.parse) and response being sent to a client is sent with application/json content-type. Base route is used to concatenate it to all controller action routes.  |

#### Controller Action Decorators

| Signature                                                      | Example                                | Description                                                                                                                                                                                                       | express.js analogue                  |
|----------------------------------------------------------------|----------------------------------------|-------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|--------------------------------------|
| `@Get(route: string\|RegExp)`                                  | `@Get("/users") all()`                 | Methods marked with this decorator will register a request made with GET HTTP Method to a given route. In action options you can specify if action should response json or regular text response.                 | `app.get("/users", all)`             |
| `@Post(route: string\|RegExp)`                                 | `@Post("/users") save()`               | Methods marked with this decorator will register a request made with POST HTTP Method to a given route. In action options you can specify if action should response json or regular text response.                | `app.post("/users", save)`           |
| `@Put(route: string\|RegExp)`                                  | `@Put("/users/:id") update()`          | Methods marked with this decorator will register a request made with PUT HTTP Method to a given route. In action options you can specify if action should response json or regular text response.                 | `app.put("/users", update)`          |
| `@Patch(route: string\|RegExp)`                                | `@Patch("/users/:id") patch()`         | Methods marked with this decorator will register a request made with PATCH HTTP Method to a given route. In action options you can specify if action should response json or regular text response.               | `app.patch("/users/:id", patch)`     |
| `@Delete(route: string\|RegExp)`                               | `@Delete("/users/:id") delete()`       | Methods marked with this decorator will register a request made with DELETE HTTP Method to a given route. In action options you can specify if action should response json or regular text response.              | `app.delete("/users/:id", delete)`   |
| `@Head(route: string\|RegExp)`                                 | `@Head("/users/:id") head()`           | Methods marked with this decorator will register a request made with HEAD HTTP Method to a given route. In action options you can specify if action should response json or regular text response.                | `app.head("/users/:id", head)`       |

#### Method Parameter Decorators

| Signature                                                          | Example                                          | Description                                                                                                                             | express.js analogue                       |
|--------------------------------------------------------------------|--------------------------------------------------|-----------------------------------------------------------------------------------------------------------------------------------------|-------------------------------------------|
| `@Req()`                                                           | `getAll(@Req() request: Request)`                | Injects a Request object.                                                                                                               | `function (request, response)`            |
| `@Res()`                                                           | `getAll(@Res() response: Response)`              | Injects a Response object.                                                                                                              | `function (request, response)`            |
| `@Param(name: string, options?: ParamOptions)`                     | `get(@Param("id") id: number)`                   | Injects a router parameter.                                                                                                             | `request.params.id`                       |
| `@Params()`                                                        | `get(@Params() params: any)`                     | Injects all request parameters.                                                                                                         | `request.params`                          |
| `@QueryParam(name: string, options?: ParamOptions)`                | `get(@QueryParam("id") id: number)`              | Injects a query string parameter.                                                                                                       | `request.query.id`                        |
| `@QueryParams()`                                                   | `get(@QueryParams() params: any)`                | Injects all query parameters.                                                                                                           | `request.query`                           |
| `@HeaderParam(name: string, options?: ParamOptions)`               | `get(@HeaderParam("token") token: string)`       | Injects a specific request headers.                                                                                                     | `request.headers.token`                   |
| `@HeaderParams()`                                                  | `get(@HeaderParams() params: any)`               | Injects all request headers.                                                                                                            | `request.headers`                         |
| `@CookieParam(name: string, options?: ParamOptions)`               | `get(@CookieParam("username") username: string)` | Injects a cookie parameter.                                                                                                             | `request.cookie("username")`              |
| `@CookieParams()`                                                  | `get(@CookieParams() params: any)`               | Injects all cookies.                                                                                                                    | `request.cookies                          |
| `@Session(name?: string)`                                          | `get(@Session("user") user: User)`               | Injects an object from session (or the whole session).                                                                                  | `request.session.user`                    |
| `@Body(options?: BodyOptions)`                                     | `post(@Body() body: any)`                        | Injects a body. In parameter options you can specify body parser middleware options.                                                    | `request.body`                            |
| `@BodyParam(name: string, options?: ParamOptions)`                 | `post(@BodyParam("name") name: string)`          | Injects a body parameter.                                                                                                               | `request.body.name`                       |
| `@UploadedFile(name: string, options?: UploadOptions)`             | `post(@UploadedFile("filename") file: any)`      | Injects uploaded file from the response. In parameter options you can specify underlying uploader middleware options.                   | `request.file.file` (using multer)        |
| `@UploadedFiles(name: string, options?: UploadOptions)`            | `post(@UploadedFiles("filename") files: any[])`  | Injects all uploaded files from the response. In parameter options you can specify underlying uploader middleware options.              | `request.files` (using multer)            |

#### Middleware and Interceptor Decorators

| Signature                                                          | Example                                                | Description                                                                                                     |
|--------------------------------------------------------------------|--------------------------------------------------------|-----------------------------------------------------------------------------------------------------------------|
| `@Middleware({ type: "before"\|"after" })`                         | `@Middleware({ type: "before" }) class SomeMiddleware` | Registers a global middleware.                                                                                  |
| `@UseBefore()`                                                     | `@UseBefore(CompressionMiddleware)`                    | Uses given middleware before action is being executed.                                                          |
| `@UseAfter()`                                                      | `@UseAfter(CompressionMiddleware)`                     | Uses given middleware after action is being executed.                                                           |
| `@Interceptor()`                                                   | `@Interceptor() class SomeInterceptor`                 | Registers a global interceptor.                                                                                 |
| `@UseInterceptor()`                                                | `@UseInterceptor(BadWordsInterceptor)`                 | Intercepts result of the given controller/action and replaces some values of it.                                |

#### Other Decorators

| Signature                                                          | Example                                                   | Description                                                                                                                                    |
|--------------------------------------------------------------------|-----------------------------------------------------------|------------------------------------------------------------------------------------------------------------------------------------------------|
| `@Authorized(roles?: string\|string[])`                            | `@Authorized("SUPER_ADMIN")` get()                        | Checks if user is authorized and has given roles on a given route. `currentUserChecker` should be defined in routing-controllers options.      |                                                              |
| `@CurrentUser(options?: { required?: boolean })`                   | get(@CurrentUser({ required: true }) user: User)          | Injects currently authorized user. `currentUserChecker` should be defined in routing-controllers options.                                      |
| `@Header(contentType: string)`                                     | `@Header("Cache-Control", "private")` get()               | Allows to explicitly set any HTTP header returned in the response.                                                                             |
| `@ContentType(contentType: string)`                                | `@ContentType("text/csv")` get()                          | Allows to explicitly set HTTP Content-Type returned in the response.                                                                           |
| `@Location(url: string)`                                           | `@Location("http://github.com")` get()                    | Allows to explicitly set HTTP Location header returned in the response.                                                                        |
| `@Redirect(url: string)`                                           | `@Redirect("http://github.com")` get()                    | Allows to explicitly set HTTP Redirect header returned in the response.                                                                        |
| `@HttpCode(code: number)`                                          | `@HttpCode(201)` post()                                   | Allows to explicitly set HTTP code to be returned in the response.                                                                             |
| `@OnNull(codeOrError: number\|Error)`                              | `@OnNull(201)` post()                                     | Sets a given HTTP code when controller action returned null.                                                                                   |
| `@OnUndefined(codeOrError: number\|Error)`                         | `@OnUndefined(201)` post()                                | Sets a given HTTP code when controller action returned undefined.                                                                              |
| `@Render(template: string)`                                        | `@Render("user-list")` get()                         | Renders a given html template. Data returned by a controller serve as template variables.                                                      |

# @zuu/owl

## What is Owl?
Is a component of the Zuu framework designed to be stacked on top of Mink and provide all the juicy, _nightly_, experimental code in the new GraphQL stack ;)

## Quick intro
Everyone loves GraphQL... for many reasons. It solves many of the REST's problems (underfetching, overfetching, unwanted resource access, unwanted resource fields exposure, the big number of request enpoints and many more...)

Developing GraphQL in TypeScript for the nodejs platform is a pain... Mainly because you have to write your types twice (your internal interfaces and also the exposed SDL schema [ if you don't know what i'm talking about, go learn GraphQL then comeback and continue ;) ]).

If there only was a cool piece of code that could transform those cool ESNext decorators (that TypeScript already provides experimental suport) to the SDL schema automagically... OH WAIT! THERE IS! That's exactly what owl aims at doing :) (and much more)

## Object types
You can define your custom schema types using decorators like `@ObjectType` and `@Field(type?)` like so:
```typescript
@ObjectType()
export class Alumni {
    @Field({nullable: true})
    public description: string;

    @Field(type => [String])
    public editions: string[];

    @Field(type => AlumniUser)
    public user: AlumniUser;
};
```

## Resolvers
Name by convention.. Easy to define using `@Resolver` decorator. Inside a resolver you can definde queries (`@Query`), mutations (`@Mutation`) and subscription (`@Subscription`). You can also inject the current context, mutation or query arguments and the PubSub engine in the methods!
```typescript
@Resolver()
export class NotificationsResolver {
    @Inject private notificationBundler: NotificationBundler;

    private notificationRepository: Repository<Notification>;

    private self() {
        if (!this.notificationRepository) this.notificationRepository = getRepository(Notification);
    }

    @Subscription(returns => Notification, {
        topics: "NOTIFICATIONS",
        filter: async ({ payload, context }: ResolverFilterData<Notification>) => (await payload.user).id == (<any>context).user.id,
    })
    userNotifications(@Root() notification: Notification) {
        return notification;
    }

    @Query(returns => [Notification])
    public async notifications(
        @Arg("type", { nullable: true }) type: string,
        @Arg("status", { nullable: true }) status: string,
        @Ctx("user") user: User
    ): Promise<Notification[]> {
        this.self();

        let query: any = { user };
        if (type) query.type = type;
        if (status) query.status = status;

        let notifications = await this.notificationRepository.find(query)
        return notifications;
    }

    @Query(returns => Notification)
    public async notification(
        @Ctx("notifications") notifications: Notification[]
    ): Promise<Notification> {
        if(!notifications[0]) throw new RequiredResourceNotProvidedError("notifications");
        return notifications[0];
    }

    @Mutation(returns => Notification, { nullable: true })
    public async pushNotification(
        @Arg("type", { nullable: true }) type: string,
        @Arg("status", { nullable: true }) status: string,
        @Arg("message", { nullable: true }) message: string,
        @Arg("payload", { nullable: true }) payload: string,
        @Arg("icon", {nullable: true}) icon: IconInputType,
        @Arg("targetUser", { nullable: true }) targetUser: string,
        @PubSub("NOTIFICATIONS") publish: Publisher<Notification>,
        @Ctx("user") user: User
    ): Promise<Notification> {
        this.self();

        if(targetUser) user = await User.findOne(targetUser);
        if(!user) return null;

        let notificaion = await this.notificationBundler.assemble(<NotificationType>type, message, payload, <NotificationStatus>status, !icon ? undefined : icon.export());
        (await user.notifications).push(notificaion);
        await user.save();

        await publish(notificaion);
        return notificaion;
    }

    @Mutation(returns => [Notification])
    public async seeNotifications(
        @Ctx("notifications") notifications: Notification[]
    ): Promise<Notification[]> {
        if(!notifications) throw new RequiredResourceNotProvidedError("notifications");

        for(let i = 0; i < notifications.length; i++) {
            notifications[i].status = NotificationStatus.SEEN;
            await notifications[i].save();
        }
        return notifications;
    }

    @Mutation(returns => [Notification])
    public async seeAllNotifications(
        @Ctx("user") user: User
    ): Promise<Notification[]> {
        let notifications = await this.notifications(undefined, NotificationStatus.SENT, user);
        return await this.seeNotifications(notifications);
    }
}
```

# @zuu/bootstrap

## What is Bootstrap?
Good question.. Bootstrap is a component of the Zuu framework that combines every other's component configuration object into a single object, making it easy to start with the framework. It also adds custom event listeners for Mink, Owl, Ferret and more! It also ties rogether all the DI containers into a single one, provided by Vet and made globaly available in the entire app.

## The configuration object?
There you go! :) Pretty self explanatory
```typescript
export interface ZuuOptions extends MinkOptions {
    model?: ConnectionOptions,
    server?: {
        port?: number,
        modules?: AbstractModule[]
    },
    graph?: GQLOptions,
    resolvers?: Function[],
    listeners?: AbstractEventListener<any>[]
}
```

You can register listeners, configure Ferret and Mink, also Owl and youcan add server modules into the mix!

## What does it provide?
A simple class `Bootstrap` that has a static method `scope(config)` that returns a `BootstrapedConfiguration` that can be run in an asyn runtime to return an Express (by default) instance.
```typescript
let timer = new Timer().reset();
Runtime.scoped(null, async _ => {
    Debugger.log(tag`Initialization began!`);
    let { app } = await Bootstrap.scope(options).run();
    return (typeof app != "undefined" && app != null);
})
.then(async result => {
    Debugger.log(tag`Initialization succeeded! Took ${timer.stop().diff()}ms!`);
})
.catch(Debugger.error);
```

## Server modules
Server modules are pieces of code that interact with the low-level Express/Koa/Hapi without the preinstalled driver! That means you can do really low-level stuff like... Let's say change the rendering engine to Handlebars if you wish (i actually prefer it over Jade or Pug or Blade).
```typescript
export class ExpressHandlebarsRenderer extends AbstractModule implements IBeforeHnadler {
    public constructor(private options: ExphbsOptions = {}) {
        super([LoadType.BEFORE]);
    }

    public handleBefore(app: Application): Application {
        let exhdbs: Exphbs = hdbs.create(this.options);
        app.engine("handlebars", exhdbs.engine);
        app.set("view engine", "handlebars");
        Debugger.log(tag`Module loaded!`);
        return app;
    }
};
```