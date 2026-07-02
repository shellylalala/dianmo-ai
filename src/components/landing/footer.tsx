const Footer = () => {
  return (
    <footer className="border-t">
      <div className="text-muted-foreground mx-auto max-w-6xl px-4 py-8 text-center text-sm">
        © {new Date().getFullYear()} 点墨. All rights reserved.
      </div>
    </footer>
  );
};

export default Footer;
