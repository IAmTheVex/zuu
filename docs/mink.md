<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

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
