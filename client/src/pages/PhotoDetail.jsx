import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, imgUrl } from '../api.js';
import { useAuth } from '../AuthContext.jsx';
import { Loading, ErrorMsg } from '../components/Status.jsx';

// Photo detail page: image, owner actions, comments, and the Track F AI summary
export default function PhotoDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [photo, setPhoto] = useState(null);
  const [comments, setComments] = useState([]);
  const [text, setText] = useState('');
  const [error, setError] = useState('');
  const [posting, setPosting] = useState(false);

  // Track F: AI summary state
  const [aiSummary, setAiSummary] = useState('');
  const [aiSource, setAiSource] = useState('');       // 'openai', 'demo' or 'fallback'
  const [isSummarizing, setIsSummarizing] = useState(false);

  // Fetch photo data and its comments
  useEffect(() => {
    api(`/photos/${id}`)
      .then((d) => { setPhoto(d.photo); setComments(d.comments); })
      .catch((e) => setError(e.message));
  }, [id]);

  // Owner-only delete (the server also checks ownership and returns 403 otherwise)
  const handleDelete = async () => {
    if (!confirm('Delete this photo?')) return;
    try {
      await api(`/photos/${id}`, { method: 'DELETE' });
      navigate('/photos');
    } catch (e) {
      setError(e.message);
    }
  };

  const handleComment = async (e) => {
    e.preventDefault();
    if (!text.trim()) return setError('Comment text is required.');
    setPosting(true); setError('');
    try {
      const created = await api(`/photos/${id}/comments`, { method: 'POST', body: { comment: text } });
      // Append the new comment locally so it appears without reloading the page
      setComments((prev) => [...prev, created]);
      setText('');
    } catch (err) {
      setError(err.message);
    } finally {
      setPosting(false);
    }
  };

  // Track F: request an AI summary of the comments from the server
  // (the browser never talks to OpenAI directly; the API key stays on the server)
  const handleSummarize = async () => {
    setIsSummarizing(true);
    setError(''); // Clear previous errors
    try {
      const result = await api(`/photos/${id}/summarize`, { method: 'POST' });
      setAiSummary(result.summary);
      setAiSource(result.source);
    } catch (err) {
      // Includes the friendly rate-limit message when the server returns 429
      setError(err.message);
    } finally {
      setIsSummarizing(false);
    }
  };

  if (!photo) return error ? <ErrorMsg message={error} /> : <Loading />;

  const isOwner = user && user._id === photo.userId._id;

  return (
    <div className="row">
      {/* Image Section */}
      <div className="col-md-7">
        <img src={imgUrl(photo.fileName)} className="img-fluid rounded shadow-sm" alt={photo.title} />
      </div>

      {/* Details Section */}
      <div className="col-md-5">
        <h2>{photo.title}</h2>
        <p className="text-muted">
          By {photo.userId.firstName} {photo.userId.lastName} on {new Date(photo.dateTime).toLocaleString()}
        </p>
        <p style={{ whiteSpace: 'pre-line' }}>{photo.description}</p>

        {/* Action Buttons */}
        <div className="d-flex flex-wrap gap-2 mb-3">
          {/* Only the owner sees the delete button */}
          {isOwner && <button className="btn btn-danger btn-sm" onClick={handleDelete}>Delete Photo</button>}

          <button
            onClick={() => {
              navigator.clipboard.writeText(window.location.href);
              alert('Link copied to clipboard!');
            }}
            className="btn btn-sm btn-outline-secondary"
          >
             Copy Link
          </button>

          <a
            href={imgUrl(photo.fileName)}
            download={`${photo.title}.jpg`}
            className="btn btn-sm btn-outline-success"
          >
             Download
          </a>
        </div>

        <hr />

        {/* Comments Section */}
        <h5>Comments</h5>
        <ErrorMsg message={error} />

        {/* Track F: AI Insights panel (placed above the comments) */}
        <div className="card mb-4 shadow-sm border-info">
          <div className="card-body bg-light">
            <div className="d-flex justify-content-between align-items-center mb-2">
              <h6 className="card-title text-info mb-0">
                <span className="me-2">🤖</span> AI Insights
              </h6>
              {/* Disabled for guests, while loading, and when there is nothing to summarize */}
              <button
                onClick={handleSummarize}
                disabled={!user || isSummarizing || comments.length === 0}
                className="btn btn-sm btn-outline-info fw-bold"
              >
                {isSummarizing ? 'Analyzing...' : 'Summarize Comments'}
              </button>
            </div>

            {/* Panel content depends on the state: guest, no comments, summary ready, or idle */}
            {!user ? (
              <small className="text-muted">Login to use AI summarization.</small>
            ) : comments.length === 0 ? (
              <small className="text-muted">Add some comments to enable AI summarization.</small>
            ) : aiSummary ? (
              <div className="alert alert-info mb-0 py-2" role="alert">
                <strong>Summary: </strong> {aiSummary}
                {/* Graceful degradation: tell the user when the local fallback was used instead of OpenAI */}
                {aiSource && aiSource !== 'openai' && <small className="d-block text-muted">(demo mode: AI service not used)</small>}
              </div>
            ) : (
              <small className="text-muted">Click the button to generate a smart summary of this discussion.</small>
            )}
          </div>
        </div>

        {/* Scrollable comment list */}
        <div className="mb-3" style={{ maxHeight: 250, overflowY: 'auto' }}>
          {comments.length === 0
            ? <p className="text-muted">No comments yet.</p>
            : comments.map((c) => (
                <div className="border-bottom py-2" key={c._id}>
                  <strong>{c.userId.firstName}:</strong> {c.comment}
                </div>
              ))}
        </div>

        {/* Add Comment Form (logged-in users only) */}
        {user ? (
          <form onSubmit={handleComment}>
            <textarea
              className="form-control mb-2"
              rows="2"
              placeholder="Add a comment..."
              value={text}
              onChange={(e) => setText(e.target.value)}
            />
            <button className="btn btn-primary btn-sm" disabled={posting}>
              {posting ? 'Posting...' : 'Post Comment'}
            </button>
          </form>
        ) : (
          <p><Link to="/login">Login</Link> to add a comment.</p>
        )}
      </div>
    </div>
  );
}