const fs = require('fs');
const path = require('path');
const mongoose = require('mongoose');
const Photo = require('../models/Photo');
const Comment = require('../models/Comment');
const { photoSchema } = require('../middleware/validation');

const removeFile = (name) => fs.unlink(path.join(__dirname, '..', 'uploads', name), () => {});

exports.getAll = async (req, res, next) => {
  try {
    const limit = parseInt(req.query.limit, 10) || 0;
    const photos = await Photo.find().sort({ dateTime: -1 }).limit(limit)
      .populate('userId', 'firstName lastName');
    res.json(photos);
  } catch (err) { next(err); }
};

exports.getOne = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Photo not found' });
    const photo = await Photo.findById(req.params.id).populate('userId', 'firstName lastName');
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    const comments = await Comment.find({ photoId: photo._id }).sort({ dateTime: 1 })
      .populate('userId', 'firstName lastName');
    res.json({ photo, comments });
  } catch (err) { next(err); }
};

exports.create = async (req, res, next) => {
  try {
    if (!req.file) return res.status(400).json({ message: 'Please select a valid image file.' });
    const { error, value } = photoSchema.validate(req.body);
    if (error) { removeFile(req.file.filename); return res.status(422).json({ message: error.details[0].message }); }
    const photo = await Photo.create({
      userId: req.userId, fileName: req.file.filename, title: value.title, description: value.description
    });
    res.status(201).json(photo);
  } catch (err) { next(err); }
};

exports.remove = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Photo not found' });
    const photo = await Photo.findById(req.params.id);
    if (!photo) return res.status(404).json({ message: 'Photo not found' });
    if (String(photo.userId) !== req.userId) {
      return res.status(403).json({ message: 'You can only delete your own photos.' });
    }
    removeFile(photo.fileName);
    await Comment.deleteMany({ photoId: photo._id }); // replaces SQL ON DELETE CASCADE
    await photo.deleteOne();
    res.json({ message: 'Photo deleted' });
  } catch (err) { next(err); }
};

// - Track F: AI comment summarization -
// Simple local fallback used when no API key is configured (clearly labelled as demo mode).
const mockSummary = (text) => {
  const t = text.toLowerCase();
  if (/(good|nice|love|great|beautiful)/.test(t)) return 'Overall, users are positive about the photo.';
  if (/(bad|boring|ugly)/.test(t)) return 'Users feel the photo could be improved.';
  return 'Users have mixed opinions about the photo.';
};

exports.summarizeCommentsAI = async (req, res, next) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) return res.status(404).json({ message: 'Photo not found' });

    const comments = await Comment.find({ photoId: req.params.id }).sort({ dateTime: 1 }).limit(50);
    if (comments.length === 0) {
      return res.status(400).json({ message: 'There are no comments to summarize yet.' });
    }
    const commentsText = comments.map((c) => c.comment).join('. ').slice(0, 3000);

    const apiKey = process.env.OPENAI_API_KEY;
    if (!apiKey) return res.json({ summary: mockSummary(commentsText), source: 'demo' });

    try {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: { Authorization: `Bearer ${apiKey}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: process.env.OPENAI_MODEL || 'gpt-4o-mini',
          messages: [
            { role: 'system', content: 'You summarize user comments about a photo in one concise sentence.' },
            { role: 'user', content: commentsText }
          ],
          max_tokens: 60
        }),
        signal: AbortSignal.timeout(10000)
      });

      // Rate-limit awareness: tell the user clearly instead of a generic error.
      if (response.status === 429) {
        return res.status(429).json({ message: 'The AI service is busy (rate limit reached). Please try again in a minute.' });
      }
      if (!response.ok) throw new Error(`OpenAI responded with status ${response.status}`);

      const data = await response.json();
      const summary = data.choices?.[0]?.message?.content?.trim();
      if (!summary) throw new Error('Empty response from OpenAI');
      return res.json({ summary, source: 'openai' });
    } catch (aiErr) {
      // Graceful degradation: the page keeps working when the AI API is unavailable.
      console.error('AI error:', aiErr.message);
      return res.json({ summary: mockSummary(commentsText), source: 'fallback' });
    }
  } catch (err) { next(err); }
};
