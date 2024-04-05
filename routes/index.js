var express = require("express");
var router = express.Router();
const Usermodel = require("./users");
const postModel = require("./post");
const localStatergy = require("passport-local");
const upload = require("./multer");
const passport = require("passport");
const { route, response } = require("../app");
passport.use(new localStatergy(Usermodel.authenticate()));

/* GET home page. */
router.get("/", function (req, res, next) {
  res.render("index", { nav: false });
});

router.get("/profile", isloggedIn, async function (req, res, next) {
  try {
    const user = await Usermodel.findOne({
      username: req.session.passport.user,
    }).populate("posts");
    console.log(user.posts); // Log the content of user.posts
    res.render("profile", { user, nav: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/show/posts", isloggedIn, async function (req, res, next) {
  try {
    const user = await Usermodel.findOne({
      username: req.session.passport.user,
    }).populate("posts");
    console.log(user.posts); // Log the content of user.posts
    res.render("show", { user, nav: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});
router.get("/feed", isloggedIn, async function (req, res, next) {
  try {
    const user = await Usermodel.findOne({
      username: req.session.passport.user,
    });
    const posts = await postModel.find().populate("user"); // Change 'User' to 'user'
    console.log(posts);
    const response = await fetch(
      `https://picsum.photos/v2/list?page=2&limit=100`
    );
    const data = await response.json();

    console.log(user.posts); // Log the content of user.posts
    res.render("feed", { user, data, posts, nav: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/show/post/:cardid", isloggedIn, async function (req, res, next) {
  try {
    const user = await Usermodel.findOne({
      username: req.session.passport.user,
    }).populate("posts");
    const postId = req.params.cardid;
    const selectedPost = user.posts.find(
      (post) => post._id.toString() === postId
    );
    if (!selectedPost) {
      // Handle case where the post with given ID is not found
      return res.status(404).send("Post not found");
    }
    res.render("showPost", { user, selectedPost, nav: true });
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/profile/:user", isloggedIn, async function (req, res) {
  let user = await Usermodel.findOne({ username: req.session.passport.user });

  if (user.username === req.params.user) {
    res.redirect("/profile");
  }

  let userprofile = await Usermodel.findOne({
    username: req.params.user,
  }).populate("posts");
  // console.log(userprofile)

  res.render("userprifile", {
    nav: true,
    userprofile,
    user,
  });
});
router.post("/update", isloggedIn, async function (req, res) {
  const user = await Usermodel.findOneAndUpdate(
    { username: req.session.passport.user },
    { username: req.body.username, fullName: req.body.fullName },
    { new: true }
  );
  req.logIn(user, function (error) {
    if (error) throw error;
    res.redirect("/profile");
  });
});
// router.get('/feed', function (req, res, next) {
//   res.render('feed', { nav: true })
// })
router.delete("/delete/post/:postId", async (req, res) => {
  try {
    const postId = req.params.postId;

    // Find the post by ID
    const post = await postModel.findById(postId);

    if (!post) {
      return res.status(404).send("Post not found");
    }

    // Check if the current user is the owner of the post
    if (post.user.toString() !== req.user._id.toString()) {
      return res
        .status(403)
        .send("Unauthorized: You do not have permission to delete this post");
    }

    // Delete the post
    await post.remove();

    // Remove the post ID from the user's posts array
    const user = await User.findById(req.user._id);
    user.posts = user.posts.filter(
      (userPostId) => userPostId.toString() !== postId
    );
    await user.save();

    res.status(200).send("Post deleted successfully");
  } catch (error) {
    console.error(error);
    res.status(500).send("Internal Server Error");
  }
});

router.get("/edit", async function (req, res) {
  const user = await Usermodel.findOne({ username: req.session.passport.user });
  res.render("edit", { user, nav: true });
});

router.get("/uplodpost", isloggedIn, async function (req, res, next) {
  const user = await Usermodel.findOne({ username: req.session.passport.user });
  res.render("uplodpost", { user, nav: true });
});

router.post(
  "/addpost",
  isloggedIn,
  upload.single("postimg"),
  async function (req, res, next) {
    try {
      const user = await Usermodel.findOne({
        username: req.session.passport.user,
      });
      const post = await postModel.create({
        title: req.body.title,
        // Join the array elements into a single string
        image: req.file.filename,
        user: user._id,
      });

      user.posts.push(post._id);
      await user.save();
      res.redirect("/profile");
    } catch (error) {
      console.error(error);
      res.status(500).send("Internal Server Error");
    }
  }
);
router.get("/search", isloggedIn, async function (req, res) {
  let user = await Usermodel.findOne({
    username: req.session.passport.user,
  });
  res.render("search", { nav: true, user });
});
router.get("/search/:user", isloggedIn, async function (req, res) {
  const searchTerm = `^${req.params.user}`;
  const regex = new RegExp(searchTerm);
  let users = await Usermodel.find({ username: { $regex: regex } });
  res.json(users);
});
router.post(
  "/submitform",
  isloggedIn,
  upload.single("image"),
  async function (req, res, next) {
    const user = await Usermodel.findOne({
      username: req.session.passport.user,
    });
    user.dp = req.file.filename;
    await user.save();
    res.redirect("/profile");
  }
);

router.get("/register", function (req, res) {
  res.render("register", { nav: false });
});

router.post("/register", function (req, res, next) {
  var userdata = new Usermodel({
    username: req.body.username,
    email: req.body.email,
    fullName: req.body.fullname,
    contact: req.body.contact,
  });
  Usermodel.register(userdata, req.body.password).then(function (resisteruser) {
    passport.authenticate("local")(req, req, function () {
      res.redirect("/profile");
    });
  });
});

router.get("/login", function (req, res){
  res.render("index", { nav: false });
});

router.post(
  "/login",
  passport.authenticate("local", {
    successRedirect: "/profile",
    failureRedirect: "/",
    failureFlash: true,
  }),
  function (req, res) {}
);

router.get("/logout", function (req, res, next) {
  req.logout(function (err) {
    if (err) {
      return next(err);
    }
    res.redirect("/");
  });
});

function isloggedIn(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.redirect("/login");
}

module.exports = router;
