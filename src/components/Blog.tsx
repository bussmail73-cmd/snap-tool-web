import { Helmet } from "react-helmet-async";

export default function Blog() {
  return (
    <div className="bg-white">
      <Helmet>
        <title>Blog | Getinbex</title>
        <meta name="description" content="Read the latest blog posts and articles about Snapchat tools, tips, and updates from Getinbex." />
        <link rel="canonical" href="https://getinbex.com/blog" />
        <meta property="og:type" content="website" />
        <meta property="og:title" content="Blog | Getinbex" />
        <meta property="og:description" content="Read the latest blog posts and articles about Snapchat tools, tips, and updates from Getinbex." />
        <meta property="og:url" content="https://getinbex.com/blog" />
        <meta property="og:image" content="https://getinbex.com/Logo.png" />
        <meta property="og:image:alt" content="Getinbex - Anonymous Snapchat Tools" />
        <meta property="og:locale" content="en_US" />
        <meta property="og:site_name" content="Getinbex" />
        <meta name="twitter:card" content="summary_large_image" />
        <meta name="twitter:title" content="Blog | Getinbex" />
        <meta name="twitter:description" content="Read the latest blog posts and articles about Snapchat tools, tips, and updates from Getinbex." />
        <meta name="twitter:image" content="https://getinbex.com/Logo.png" />
        <meta name="robots" content="index, follow" />
        <script type="application/ld+json">
        {JSON.stringify({
          "@context": "https://schema.org",
          "@type": "Blog",
          "name": "Getinbex Blog",
          "description": "Blog posts and articles about Snapchat tools and tips",
          "url": "https://getinbex.com/blog",
          "mainEntity": {
            "@type": "Organization",
            "name": "Getinbex",
            "url": "https://getinbex.com"
          }
        })}
        </script>
      </Helmet>
      
      <section className="home-section" style={{ paddingTop: "120px" }}>
        <div className="home-section-header">
          <h2>Blog & Articles</h2>
          <p>Discover expert tips, guides, and the latest updates about Snapchat tools. Learn best practices for anonymous browsing, content downloading, and more from the Getinbex team. Stay informed with community-driven insights and industry trends.</p>
        </div>
      </section>

      {/* Blog Posts Grid */}
      <section className="home-section">
        <div className="blog-posts-grid">
          <article className="blog-card">
            <div className="blog-card-image">
              <img
                src="/Blog-thumnail-1.webp"
                alt="How to Download Snapchat Videos Easy - Step by Step Guide"
                width={400}
                height={250}
                loading="lazy"
              />
            </div>
            <div className="blog-card-content">
              <h3 className="blog-card-title">How to Download Snapchat Videos Easy</h3>
              <p className="blog-card-description">Learn the easiest way to download Snapchat videos in high quality without any watermarks. This simple guide shows you step-by-step how to save your favorite Snapchat videos to your phone or computer in just a few clicks. Perfect for anyone who wants to keep their favorite memories safe.</p>
              <a href="#" className="blog-card-link">Read More →</a>
            </div>
          </article>
        </div>
      </section>
    </div>
  );
}
