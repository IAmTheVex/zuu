import { IsBase64, IsEmail, IsOptional, MinLength } from "class-validator";

export class RegisterBody {
    @IsEmail()
    public email: string;

    @MinLength(6)
    @IsBase64()
    public password: string;

    @IsOptional()
    public fullName?: string;
}