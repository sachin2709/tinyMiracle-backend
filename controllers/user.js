const User = require("../models/user");

// const { Order, ProductCart } = require("../models/order");

const crypto = require("crypto");
const uuidv1 = require("uuid/v1");



exports.getAllUser = (req, res) => {
    User.find({}, (err, users) => {
      if (err) {
        res.status(500).send(err);
      } else {
        res.status(200).json(users);
      }
    });
  };
  

exports.getUserById = (req, res, next, id) => {
  console.log(id);
  User.findById(id).exec((err, user) => {
    if (err || !user) {
      return res.status(400).json({
        error: "No user was found in DB",
      });
    }
    console.log(user);

    console.log("Hello Shiva")
    // console.log(req.profile);
    req.profile = user;

    
    next();
  });
};

exports.getUser = (req, res) => {
  req.profile.salt = undefined;
  req.profile.encry_password = undefined;
  return res.json(req.profile);
};

exports.updateUser = (req, res) => {
  if (req.body.password) {
    if (req.body.password.length >= 8) {
      let salt = uuidv1();
      let encry_password = crypto
        .createHmac("sha256", salt)
        .update(req.body.password)
        .digest("hex");

      req.body.encry_password = encry_password;
      req.body.salt = salt;
    } else {
      return res.status(400).json({ error: "Minimum 8 Character Password" });
    }
  }

  User.findByIdAndUpdate(
    { _id: req.profile._id },
    { $set: req.body },
    { new: true, useFindAndModify: false },
    (err, user) => {
      if (err) {
        return res.status(400).json({
          error: "You are not authorized to update this user",
        });
      }
      user.salt = undefined;
      user.encry_password = undefined;
      res.json(user);
    }
  );
};

// exports.userPurchaseList = (req, res) => {
//   Order.find({ user: req.profile._id })
//     .populate("user", "_id name")
//     .exec((err, order) => {
//       if (err) {
//         return res.status(400).json({
//           error: "No orders found in DB",
//         });
//       }

//       return res.json(order);
//     });
// };

exports.pushOrderInPurchaseList = (req, res, next) => {
  let purchases = [];
  req.body.order.products.forEach((product) => {
    purchases.push({
      _id: product._id,
      name: product.name,
      description: product.description,
      category: product.category,
      quantity: product.quantity,
      amount: req.body.order.amount,
      transaction_id: req.body.order.transaction_id,
    });
  });

  //store thi in DB
  User.findOneAndUpdate(
    { _id: req.profile._id },
    { $push: { purchases: purchases } },
    { new: true },
    (err, purchases) => {
      if (err) {
        return res.status(400).json({
          error: "Unable to save purchase list",
        });
      }
      next();
    }
  );
};
