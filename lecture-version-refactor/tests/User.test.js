const User = require("../models/User");

describe("User", () => {
    // test("create", async () => {
    //     const user = await User.create({ username: "test", email: "rede@gg.com", password: "123456" });
    //     expect(user.username).toBe("test");
    //     expect(user.password).not.toBe("123456");
    // });
    test("get", async () => {
        const user = await User.get({ username: "test" });
        expect(user.username).toBe("test");
    });
    test("generateToken", async () => {
        const user = await User.get({ username: "test" });
        const token = User.generateToken(user);
        expect(token).toHaveProperty("accesToken");
        expect(token).toHaveProperty("refreshToken");
        expect(token).toHaveProperty("expireAt");
    });
    test("decode token", async () => {
        const user = await User.get({ username: "test" });
        const token = User.generateToken(user);
        const decoded = User.parseToken(token.accesToken);
        expect(decoded.id).toBe(user.id);
    });
    test("authenticate password", async () => {
        const authenticated = await User.authenticate("test", "123456");
        expect(authenticated).toBe(true);
    });
    test("fail authenticate password", async () => {
        const authenticated = await User.authenticate("test", "random");
        expect(authenticated).toBe(false);
    });
});