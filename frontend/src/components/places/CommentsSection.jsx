import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMap } from '../../hooks/useMap';

const CommentsSection = ({ placeId, comments = [], isAuthenticated }) => {
  const navigate = useNavigate();
  const { addComment } = useMap();
  const [newComment, setNewComment] = useState('');
  const [loading, setLoading] = useState(false);
  
  const handleAddComment = async (e) => {
    e.preventDefault();
    
    if (!isAuthenticated) {
      navigate('/login');
      return;
    }
    
    if (!newComment.trim()) return;
    
    try {
      setLoading(true);
      await addComment(placeId, newComment.trim());
      setNewComment('');
      // Refresh the page to show the new comment
      window.location.reload();
    } catch (err) {
      console.error('Failed to add comment:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2 className="mb-4 font-semibold text-xl">Comments ({comments.length})</h2>
      
      {/* Comment form */}
      {isAuthenticated && (
        <form onSubmit={handleAddComment} className="mb-6">
          <textarea
            id="comment-input" // Added ID for direct focus
            className="px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 w-full"
            rows="3"
            placeholder="Add a comment..."
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            disabled={loading}
          ></textarea>
          <button
            type="submit"
            className="bg-blue-500 hover:bg-blue-600 disabled:bg-blue-300 mt-2 px-4 py-2 rounded-lg text-white transition"
            disabled={loading || !newComment.trim()}
          >
            {loading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      )}
      
      {/* Comment list */}
      {comments.length === 0 ? (
        <div className="bg-gray-50 p-8 rounded-lg text-center">
          <p className="text-gray-500">No comments yet. Be the first to share your thoughts!</p>
          {!isAuthenticated && (
            <button
              className="bg-blue-500 hover:bg-blue-600 mt-4 px-4 py-2 rounded-lg text-white transition"
              onClick={() => navigate('/login')}
            >
              Login to Comment
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between">
                <p className="font-medium">{comment.user?.username}</p>
                <p className="text-gray-500 text-sm">
                  {new Date(comment.created_at).toLocaleString()}
                </p>
              </div>
              <p className="mt-2 whitespace-pre-line">{comment.content}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommentsSection;