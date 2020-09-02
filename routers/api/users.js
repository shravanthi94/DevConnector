const express = require("express");
const router = express.Router();
const { check, validationResult } = require("express-validator");
const gravatar = require("gravatar");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const config = require("config");

//Get the User mongoose model
const User = require("../../models/User");

// @route  POST api/users
// @desc   Register Users
// @access Public

router.post(
  "/",
  [
    check("name", "Name is required.").notEmpty(),
    check("email", "Please include a valid email.").isEmail(),
    check(
      "password",
      "Please enter a password with 6 or more characters"
    ).isLength({ min: 5 })
  ],
  async (req, res) => {
    const errors = validationResult(req);
    const hasErrors = !errors.isEmpty();

    if (hasErrors) {
      res.status(400).json({ errors: errors.array() });
    }

    const { name, email, password } = req.body;

    try {
      // 1. See if user exists
      let user = await User.findOne({ email });

      if (user) {
        res.status(400).json({ errors: [{ msg: "User already exits." }] });
      }

      // 2. get user gravatar
      const avatar = gravatar.url(email, {
        s: "200",
        r: "pg",
        d: "mm"
      });

      //3. Create user
      user = new User({
        name,
        email,
        avatar,
        password
      });

      // 4. encrypt password using bcrypt
      //we get a promise from genSalt
      const salt = await bcrypt.genSalt(10);
      user.password = await bcrypt.hash(password, salt);

      //5. save the user
      await user.save();

      // 6. return jsonWebToken
      const payload = {
        user: {
          id: user.id
        }
      };

      jwt.sign(
        payload,
        config.get("jwtSecret"),
        { expiresIn: "10 hours" },
        (err, token) => {
          if (err) throw err;
          res.json({ token });
        }
      );
    } catch (err) {
      console.log(err.message);
      return res.send(400).json();
    }
  }
);

module.exports = router;
