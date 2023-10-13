exports.is_authenticated = (req, res, next) => {
    if(!req.user){
        return res.status(401).json({message: "You are not authenticated"})
    }
    next();
}
exports.is_superuser = async (req, res, next) => {
    await exports.is_authenticated(req, res, async () => {
        const isAdmin = await req.user.is_superuser();
        if (!isAdmin) {
            res.status(403).json({ error: "Not authorized" });
            return;
        }
        next();
    });
};
