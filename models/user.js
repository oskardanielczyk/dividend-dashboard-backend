const mongoose = require("mongoose");
const uniqueValidator = require("mongoose-unique-validator");

const Schema = mongoose.Schema;

const usersSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, minlength: true },
  image: { type: String, required: true },
  transactions: [
    {
      type: mongoose.Types.ObjectId,
      require: true,
      ref: "Transaction",
    },
  ],
});

usersSchema.plugin(uniqueValidator);

module.exports = mongoose.model("User", usersSchema);
