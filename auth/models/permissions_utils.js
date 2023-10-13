
const {UserMongo} = require('./UserMongo');
exports.attachPerm = async (user, perm) => {
    await UserMongo.findOneAndUpdate({ _id: user._id }, { $addToSet: { permissions: perm } });
};
exports.detachPerm = async (user, perm) => {
    user.permissions.pull(perm);
    await user.save();
};