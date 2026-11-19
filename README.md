# Hashtag Tshisaah — Online Store

Online store for **Hashtag Tshisaah Clothing**: Kasi Vibe bucket hats and the Certified tee. It's built from the approved UI prototype, with the same look (IBM Plex Mono, the `#T` script mark, forest green and gold) and the same shopping flow.

It's plain HTML, CSS and JavaScript, with no build step and no monthly platform fees. It runs on any standard web hosting, including the client's existing hosting.

## What's included

| Area | Features |
| --- | --- |
| **Home** | Summer '26 drop hero, New In, Certified feature, delivery/returns highlights, lookbook strip |
| **Product catalogue** | Category and colour filters, 6 products/colourways, wishlist hearts |
| **Product page** | Colourway thumbnails and swatches, size picker, add to bag, save to wishlist, details / fit / delivery accordion, "Complete the look" |
| **Bag & checkout** | Quantity controls; 3-step checkout (details → delivery → payment) with validation; Courier R 99 / PAXI R 59 / Studio collection; Card, Instant EFT, SnapScan |
| **Order tracking** | Look up an order by number + email, with a status timeline and waybill |
| **Customer account** | Sign in / create account, order history, saved items |
| **Gallery** | Lookbook with full-screen image viewer |
| **Contact & social** | Contact form that opens WhatsApp, floating WhatsApp button, Instagram / TikTok / Facebook links |
| **SEO & analytics** | Page titles per view, meta description, Open Graph tags, schema.org `ClothingStore` data, Google Analytics 4 e-commerce events (view_item, add_to_cart, begin_checkout, purchase) |
| **Help pages** | Delivery table, returns, size guide, payment, POPIA privacy notice, terms |

The layout is responsive, from phones (390px) up to wide desktops.

## Try it

Open `index.html` in a browser, or serve the folder:

```bash
npx serve .
```

Demo data: track order **TSH-10482** with **lerato.m@gmail.com**.

## Project structure

```
index.html        Page shell: header, footer, SEO tags
css/styles.css    All styling (brand tokens at the top)
js/config.js      Store settings: WhatsApp number, email, social links, demo mode, GA4 ID
js/products.js    Catalogue, colours, delivery and payment options
js/app.js         Storefront logic and all pages
img/              Product photography
```

**To add a product or colourway**, edit `js/products.js` and drop the photo into `img/`.

## Preview mode vs. going live

The site currently runs in **preview mode** (`demoMode: true` in `js/config.js`):

- Checkout simulates payment. No money is taken.
- Orders, accounts and the wishlist are saved in the visitor's own browser, not on a server.

To take real orders:

1. **Payments.** Connect PayFast (Card, Instant EFT, SnapScan) and/or Yoco. Card details are entered on the provider's secure page and never touch this site. This needs one small server script on the hosting (PHP is fine) to sign the payment request and receive the payment confirmation. The hook point is `placeOrder()` in `js/app.js`.
2. **Orders & accounts.** Store orders server-side so the owner sees them and Track Order works across devices. Order statuses (received → packed → shipped → delivered) then get updated from an admin view or a simple sheet.
3. **Emails.** Send order confirmation emails, plus WhatsApp shipping updates via the business number.
4. **Settings.** Set real social handles, the GA4 ID and the live domain in `og:image`. Confirm the tee size chart in Help with the supplier.
5. Set `demoMode: false`.

## Deploying

Upload the folder contents to the hosting's `public_html`, or publish with GitHub Pages (Settings → Pages → deploy from `main`).
