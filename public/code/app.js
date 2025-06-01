function loadBlogStylesheet() {
  if (!document.getElementById('blogStyles')) {
    const link = document.createElement('link');
    link.id = 'blogStyles';
    link.rel = 'stylesheet';
    link.href = 'blog/style.css';  // Corrected path
    document.head.appendChild(link);
  }
}
