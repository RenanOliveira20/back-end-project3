const { Router } = require('express');
const Game = require('../models/Game.model');
const Comment = require('../models/Comment.model');
const uploadImage = require("../middlewares/gamepicture.middleware");
const cloudinary = require("cloudinary").v2;
const router = Router();

router.get('/all', async (req, res) => {
    try {
        const games = await Game.find();
        res.status(200).json(games);

    } catch (error) {
        res.status(500).json({ message: 'Error to get all games', error });
    };
});

router.get('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        const logGame = await Game.findOne({ _id: id }).populate("comments", ['user', 'text']);

        if (!logGame) {
            throw new Error("Game not found");
        };

        res.status(200).json(logGame);

    } catch (error) {
        res.status(500).json({ message: 'Error on find game', error });
    };
});

router.post('/', async (req, res) => {

    if (!req.body.name) {
        return res.status(400).json({ message: 'Missing name field' });
    };

    try {
        await Game.create(req.body);

        res.status(201).json({ message: 'Game created sucessful' });

    } catch (error) {
        res.status(500).json({ messag: 'Error while creating game', error });
    };
});

router.post('/comment/:id', async (req, res) => {
    const { id } = req.params;
    const commentBody = { ...req.body };
    
    console.log( req)
    try {
        const newComment = await Comment.create({
            text: commentBody.text,
            user: req.user.id,
        });
        res.status(200).json({ message: "new comment to post" });
    } catch (error) {
        res.status(500).json({
            message: "error creating a comment for the post",
            error: error.message,
        });
    };
});

router.put('/:id', async (req, res) => {
    const { id } = req.params;
    const payload = req.body;

    try {
        const updateGame = await Game.findOneAndUpdate({ _id: id }, payload, { new: true });

        res.status(200).json(updateGame);

    } catch (error) {
        res.status(500).json({ message: 'Error while updating game', error });
    };
});


router.delete('/:id', async (req, res) => {
    const { id } = req.params;

    try {
        await Game.findByIdAndDelete(id);



        res.status(201).json({ message: 'Game deleted sucessful' });

    } catch (error) {
        res.status(500).json({ message: 'Error while deleting game', error });
    };
});


router.delete('/:id/:commentId', async (req, res) => {

    const { id, commentId } = req.params;
    const logUser = req.user.id;

   try {
        if (await Game.findOne({ $and: [{ _id: id }, { user: logUser }] }) || await Comment.findOne({ $and: [{ _id: id }, { user: logUser }] })) {
           
           await Comment.findOneAndDelete({ _id: commentId});
           const game = await Game.findOne({ _id: id });
           const index = game.comments.findIndex((element) => element._id === commentId );

            game.comments.splice(index,1);
            game.save();

            res.status(200).json({msg:'Comment deleted sucessful'});
        };
    } catch (error) {
        res.status(500).json({msg:'Error while deleting comment'});
    } 
});

router.put('/uploadimage/:id', uploadImage.single('image'), async (req , res) => {
    if (!req.file) {
        res.status(400).json({ Error: "Image was not sent" });
        return;
    }
    const { path } = req.file;
    const { id } = req.params;

    try {
        const updateGame = await Game.findByIdAndUpdate(
            id,
            { background_image: path },
            { new: true }
        );
        res.status(200).json(updateGame);
    } catch (error) {
        res.status(500).json(error);
    }
});

router.put("/deleteimage/:id", async (req, res) => {
    const { id } = req.params;
    try {
        const game = await Game.findById(id);
        const { background_image } = game;
        const imgArray = background_image.split("/");
        const img = imgArray[imgArray.length - 1];
        const imgName = img.split(".")[0];
        console.log(imgName)
        await cloudinary.uploader.destroy(`ConnectGames/imageGames/${imgName}`);
        const updateGame = await Game.findByIdAndUpdate (
            id,
            { background_image: "" },
            { new: true }
        );
        res.status(200).json(updateGame);
    } catch (error) {
        res.status(500).json(error);
    };
});

module.exports = router
