const router = require('express').Router();
const photos = require('../controllers/photoController');
const requireUser = require('../middleware/requireUser');
const upload = require('../middleware/upload');

router.get('/', photos.getAll);
router.get('/:id', photos.getOne);
router.post('/', requireUser, upload.single('photoFile'), photos.create);
router.delete('/:id', requireUser, photos.remove);

// Track F: AI comment summarization (server-side proxy to OpenAI)
router.post('/:id/summarize', requireUser, photos.summarizeCommentsAI);

module.exports = router;
