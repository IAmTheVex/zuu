import { IsBase64, IsEmail, MinLength } from "class-validator";

export class LoginBody {
    @IsEmail()
    public email: string;

    @MinLength(6)
    @IsBase64()
    public password: string;
}