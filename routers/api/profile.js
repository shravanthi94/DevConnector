const express = require("express");
const router = express.Router();
const request = require("request");
const config = require("config");
const { check, validationResult } = require("express-validator");

const auth = require("../../middleware/auth");

const Profile = require("../../models/Profile");
const User = require("../../models/User");

// @route  GET api/profile/me
// @desc   Get current user's profile
// @access Private

router.get("/me", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.user.id
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res
        .status(400)
        .json({ msg: "There is no profile for this user." });
    }

    res.json(profile);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error");
  }
});

// @route  POST api/profile
// @desc   Create or update current user's profile
// @access Private

router.post(
  "/",
  [
    auth,
    [
      check("status", "Status is required.").not().isEmpty(),
      check("skills", "Skills are required.").not().isEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const {
        company,
        website,
        location,
        bio,
        status,
        githubusername,
        skills,
        youtube,
        facebook,
        twitter,
        instagram,
        linkedin
      } = req.body;

      //console.log(req.body);
      //Build user profile
      const profileFields = {};

      //link to user id
      profileFields.user = req.user.id;
      //required fields
      profileFields.status = status;
      profileFields.skills = skills.split(",").map((skill) => skill.trim());
      //Other input fields
      if (company) profileFields.company = company;
      if (website) profileFields.website = website;
      if (location) profileFields.location = location;
      if (bio) profileFields.bio = bio;
      if (githubusername) profileFields.githubusername = githubusername;

      //console.log(profileFields.skills);

      //Build social object
      const socials = {};
      if (youtube) socials.youtube = youtube;
      if (facebook) socials.facebook = facebook;
      if (twitter) socials.twitter = twitter;
      if (instagram) socials.instagram = instagram;
      if (linkedin) socials.linkedin = linkedin;

      profileFields.social = socials;

      //console.log(profileFields);

      try {
        let profile = await Profile.findOne({ user: req.user.id });

        if (profile) {
          //Update
          profile = await Profile.findOneAndUpdate(
            { user: req.user.id },
            { $set: profileFields },
            { new: true }
          );

          return res.json(profile);
        }

        //Create
        profile = new Profile(profileFields);

        await profile.save();

        res.json(profile);
      } catch (err) {
        console.log(err.message);
        res.status(500).send("Server Error.");
      }
    }
  }
);

// @route  GET api/profile
// @desc   Get all profiles
// @access Public

router.get("/", async (req, res) => {
  try {
    const profiles = await Profile.find().populate("user", ["name", "avatar"]);
    res.json(profiles);
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error.");
  }
});

// @route  GET api/profile/user/:user_id
// @desc   Get profile by user id
// @access Public

router.get("/user/:user_id", async (req, res) => {
  try {
    const profile = await Profile.findOne({
      user: req.params.user_id
    }).populate("user", ["name", "avatar"]);

    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.json(profile);
  } catch (err) {
    console.log(err.message);
    if (err.kind == "ObjectId") {
      return res.status(400).json({ msg: "Profile not found." });
    }
    res.status(500).send("Server Error.");
  }
});

// @route  DELETE api/profile
// @desc   Delete profile, user and posts
// @access Private

router.delete("/", auth, async (req, res) => {
  try {
    //delete profile
    await Profile.findOneAndRemove({ user: req.user.id });
    //Delete user
    await User.findOneAndRemove({ user: req.user.id });
    //Delete posts

    res.json({ msg: "User deleted." });
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error.");
  }
});

// @route  PUT api/profile/experience
// @desc   Update/add profile with experience
// @access Private

router.put(
  "/experience",
  [
    auth,
    [
      check("title", "Title is required").notEmpty(),
      check("company", "Company is required").notEmpty(),
      check("from", "From date is required").notEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      return res.status(400).json({ errors: errors.array() });
    } else {
      const {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      } = req.body;

      const newExp = {
        title,
        company,
        location,
        from,
        to,
        current,
        description
      };

      try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.experience.unshift(newExp);

        await profile.save();

        res.json(profile);
      } catch (err) {
        console.log(err.message);
        res.send(500).send("Server Error.");
      }
    }
  }
);

// @route  DELETE api/profile/experience
// @desc   Delete profile experience using exp_id
// @access Private

router.delete("/experience/:exp_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      return res.status(400).json({ msg: "Profile not found." });
    } else {
      console.log(profile);
      profile.experience = profile.experience.filter(
        (each) => each._id.toString() !== req.params.exp_id
      );

      await profile.save();

      res.json(profile);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error.");
  }
});

// @route  PUT api/profile/education
// @desc   Update/add profile with experience
// @access Private

router.put(
  "/education",
  [
    auth,
    [
      check("school", "School is required").notEmpty(),
      check("degree", "Degree is required").notEmpty(),
      check("fieldofstudy", "Field of study is required").notEmpty(),
      check("from", "From date is required").notEmpty()
    ]
  ],
  async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
      res.status(400).json({ errors: errors.array() });
    } else {
      const {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      } = req.body;

      const newEdu = {
        school,
        degree,
        fieldofstudy,
        from,
        to,
        current,
        description
      };

      try {
        const profile = await Profile.findOne({ user: req.user.id });

        profile.education.unshift(newEdu);

        await profile.save();

        res.json(profile);
      } catch (err) {
        console.log(err.message);
        res.send(500).send("Server Error.");
      }
    }
  }
);

// @route  DELETE api/profile/education
// @desc   Delete profile experience using edu_id
// @access Private

router.delete("/education/:edu_id", auth, async (req, res) => {
  try {
    const profile = await Profile.findOne({ user: req.user.id });

    if (!profile) {
      res.status(400).json({ msg: "Profile not found." });
    } else {
      profile.education = profile.education.filter(
        (each) => each._id.toString() !== req.params.edu_id
      );

      await profile.save();

      res.json(profile);
    }
  } catch (err) {
    console.log(err.message);
    res.status(500).send("Server Error.");
  }
});

// @route  GET api/profile/github/:username
// @desc   Get 5 github repos by username
// @access Public

router.get("/github/:username", (req, res) => {
  try {
    const options = {
      uri: encodeURI(
        `https://api.github.com/users/${req.params.username}/repos?per_page=5&sort=created:asc`
      ),
      method: "GET",
      headers: {
        "user-agent": "node.js",
        Authorization: `token ${config.get("githubAccessToken")}`
      }
    };

    request(options, (error, response, body) => {
      if (error) {
        console.log(error);
      }

      if (response.statusCode !== 200) {
        return res.status(404).json({ msg: "No github user found." });
      }

      res.json(JSON.parse(body));
    });
  } catch (err) {
    console.log(err);
    res.status(500).send("Server Error");
  }
});

module.exports = router;
