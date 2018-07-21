export interface SecurityConfig {
    hash: {
        salt: {
            length: number,
            secret: string
        }
    },
    token: {
        expires: string,
        secret: string
    }
}