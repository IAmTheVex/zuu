import { BaseEntity, Column, CreateDateColumn, Entity, Index, PrimaryGeneratedColumn, OneToMany } from '@zuu/ferret';
import { Field, ID, ObjectType } from "@zuu/owl";
import { Lazy } from '../../packages/async/Lazy';
import { Note } from './Note';

@ObjectType()
@Entity()
export class User extends BaseEntity {
    @Field(type => ID)
    @PrimaryGeneratedColumn("uuid")
    @Index()
    public id: string;

    @Field()
    @CreateDateColumn()
    public created: Date;

    @Field()
    @Column({
        unique: true
    })
    @Index()
    public email: string;

    @Column()
    public password: string;

    @Field({ nullable: true })
    @Column({ nullable: true })
    public fullName: string;

    @Field(type => [Note])
    @OneToMany(type => Note, note => note.user, {lazy: true})
    public notes: Lazy<Note[]>;

    public constructor(email: string, password: string) {
        super();
        
        this.email = email;
        this.password = password;
    }
}