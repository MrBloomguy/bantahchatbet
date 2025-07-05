// ...existing imports...

const MobileNavigation: React.FC = () => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 z-40">
      <div className="flex justify-around items-center h-16">
        <NavLink to="/home">
          <img src="/home_icon.png" alt="Home" className="w-6 h-6" />
        </NavLink>
        
        <NavLink to="/events">
          <img src="/events_icon.png" alt="Events" className="w-6 h-6" />
        </NavLink>
        
        <NavLink to="/chat">
          <img src="/chat_icon.png" alt="Chat" className="w-6 h-6" />
        </NavLink>
        
        <NavLink to="/profile">
          <img src="/profile_icon.png" alt="Profile" className="w-6 h-6" />
        </NavLink>
      </div>
    </nav>
  );
};
