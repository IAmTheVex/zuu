<div align="center">
  <a href="http://zuu.thevexis.me/">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/big_title.png">
  </a>
</div>

# @zuu/owl

[![Version](https://img.shields.io/npm/v/@zuu/owl.svg)](https://npmjs.org/package/@zuu/owl)
[![Downloads/week](https://img.shields.io/npm/dw/@zuu/owl.svg)](https://npmjs.org/package/@zuu/owl)
[![License](https://img.shields.io/npm/l/@zuu/owl.svg)](https://github.com/IAmTheVex/zuu/blob/master/package.json)

## What is Owl?
Is a component of the Zuu framework designed to be stacked on top of Mink and provide all the juicy, _nightly_, experimental code in the new GraphQL stack ;)

## Want to contribute?
Here's how!
<div align="center">
  <a href="https://github.com/IAmTheVex/zuu/blob/master/CONTRIBUTING.md">
    <img src="https://github.com/IAmTheVex/zuu/raw/master/assets/branching.png">
  </a>
</div>

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

