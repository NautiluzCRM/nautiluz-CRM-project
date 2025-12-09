import { UserModel } from '../modules/users/user.model.js';
import { verifyPassword } from './password.js';
import { signAccessToken, signRefreshToken, verifyRefreshToken } from './jwt.js';
import { AppError } from '../common/http.js';
import { StatusCodes } from 'http-status-codes';
export async function login(email, password) {
    const user = await UserModel.findOne({ email, active: true });
    if (!user)
        throw new AppError('Credenciais inválidas', StatusCodes.UNAUTHORIZED);
    const ok = await verifyPassword(user.passwordHash, password);
    if (!ok)
        throw new AppError('Credenciais inválidas', StatusCodes.UNAUTHORIZED);
    const payload = { sub: String(user._id), role: user.role };
    const accessToken = signAccessToken(payload);
    const refreshToken = signRefreshToken(payload);
    return { accessToken, refreshToken, user };
}
export async function refresh(token) {
    const payload = verifyRefreshToken(token);
    const user = await UserModel.findById(payload.sub);
    if (!user || !user.active)
        throw new AppError('Usuário não encontrado', StatusCodes.UNAUTHORIZED);
    const accessToken = signAccessToken({ sub: payload.sub, role: payload.role });
    return { accessToken };
}
