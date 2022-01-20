var mongoose = require('mongoose');

var usersSchema = mongoose.Schema({
    uid: String,
    name: String,
    pic: {type: String, default: 'https://res.cloudinary.com/dm1smalbq/image/upload/v1620325518/ImageAdvancedWeb/user_vjvmvt.png'},
    role: String,
    created: Date,
    email: String,
    username: String,
    password: String,
    idcategory: [{ type: mongoose.Types.ObjectId, ref: 'categories' }],
    class: String,
    faculty: String
});

var users = mongoose.model('users', usersSchema);
module.exports = users;