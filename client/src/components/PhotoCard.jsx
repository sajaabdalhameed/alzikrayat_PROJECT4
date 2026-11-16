import { Link } from 'react-router-dom';
import { imgUrl } from '../api.js';

// Displays one photo as a card. `view` is 'grid' (default) or 'list', chosen in Gallery.
export default function PhotoCard({ photo, view }) {
  const isList = view === 'list';

  return (
    // Full-width row in list view, three cards per row (col-md-4) in grid view
    <div className={isList ? 'col-12 mb-3' : 'col-md-4 mb-4'}>
      <div className={'card h-100 gallery-card' + (isList ? ' flex-row' : '')}>
        <img src={imgUrl(photo.fileName)} alt={photo.title}
          className={isList ? 'gallery-thumb-list' : 'gallery-thumb'} />
        <div className="card-body d-flex flex-column">
          <h5 className="card-title">{photo.title}</h5>
          {/* photo.userId is populated by the server with the owner's first and last name */}
          <p className="card-text text-muted mb-2">By {photo.userId.firstName} {photo.userId.lastName}</p>
          {/* mt-auto pushes the button to the bottom so all cards line up */}
          <div className="mt-auto">
            <Link to={`/photos/${photo._id}`} className="btn btn-outline-primary btn-sm">View Details</Link>
          </div>
        </div>
      </div>
    </div>
  );
}