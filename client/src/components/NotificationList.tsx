import React from 'react';
import './NotificationList.css';


interface Notification {
  id: string;
  type: string;
  title: string;
  content: string;
  read_at: Date | null;
  metadata: any;
}

const NotificationItem: React.FC<{ notification: Notification }> = ({ notification }) => {
    return (
      <div className="notification-item">
        {/* Placeholder for avatar/icon */}
        <div className="notification-avatar">
          <img src="/placeholder-avatar.png" alt="Avatar" /> 
        </div>
  
        <div className="notification-content">
          {notification.type === "challenge_received" ? (
            <div>
              <p>You have been challenged!</p>
              <p>Challenger: {notification.metadata.challenger_username}</p>
              <p>Game: {notification.metadata.game_type}</p>
              <div className="notification-actions">
                <button className="button deny-button">Deny</button>
                <button className="button approve-button">Approve</button>
              </div>
            </div>
          ) : (
            <p>{notification.title}</p>
          )}
  
          {/* Placeholder for timestamp/context */}
          <div className="notification-timestamp">
            {/* Add timestamp or other context here */}
            <p>Yesterday</p> 
          </div>
        </div>
      </div>
    );
};

export const NotificationList: React.FC = () => {
  const { notifications, loading, hasMore, loadMore, markAllAsRead } = useNotification();

  return (
    <div className="notification-page">
      <div className="notification-header">
        <h2>Notifications</h2>
        <button onClick={markAllAsRead} className="mark-all-read-button">
          Mark all as read
        </button>
      </div>
    <div className="notification-tabs">
      <button className="tab active">All</button>
      <button className="tab">Inbox</button>
      <button className="tab">Following</button>
      <button className="tab">Archived</button>
    </div>
    <div className="notifications-container">
      {notifications.map(notification => (
        <NotificationItem key={notification.id} notification={notification} />
      ))}
      
      {loading && (
        <div className="loading-spinner">Loading...</div>
      )}
      
      {hasMore && !loading && (
        <button 
          onClick={loadMore}
          className="load-more-button"
        >
          Load More
        </button>
      )}
      
      {!hasMore && notifications.length > 0 && (
        <div className="no-more-notifications">
          No more notifications
        </div>
      )}
      
      {!loading && notifications.length === 0 && (
        <div className="no-notifications">
          No notifications yet
        </div>
      )}
    </div>
    </div>
  );
}