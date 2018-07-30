<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

# @zuu/mink 

[![Gitter](https://img.shields.io/gitter/room/nwjs/nw.js.svg?style=for-the-badge)](https://gitter.im/zuu-framework/)
[![Version](https://img.shields.io/npm/v/@zuu/mink.svg)](https://npmjs.org/package/@zuu/mink)
[![Downloads/week](https://img.shields.io/npm/dw/@zuu/mink.svg)](https://npmjs.org/package/@zuu/mink)
[![License](https://img.shields.io/npm/l/@zuu/mink.svg)](https://github.com/IAmTheVex/zuu/blob/master/package.json)

## What is Mink?
Mink is.. AMAZING!!! No... For real now... It's a component of the Zuu framework responsable for the routing and the setup of the server (has drivers for express, koa and hapi). Also dows some sweet websocket stuff (baking service for OWL Subscriptions) :)

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>

## Controllers
Mink calls the smallest unit of organization a `Controller`.

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
