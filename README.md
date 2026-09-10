# Kathiyawadi Karigari — Free-first website MVP

This is Version 1 of the customer-facing website.

## Current catalog

Two designs, each with nine size/price variants:

1. Couple Hoop Without Tassels
   6 ₹579, 8 ₹779, 10 ₹1149, 12 ₹1599, 14 ₹2229,
   16 ₹3129, 18 ₹4469, 20 ₹6529, 22 ₹9269

2. Couple Hoop With Tassels
   6 ₹889, 8 ₹1149, 10 ₹1579, 12 ₹2099, 14 ₹2859,
   16 ₹3829, 18 ₹5239, 20 ₹7369, 22 ₹10239

## Run locally

Because this version is static, you can open `index.html` directly, or use VS Code Live Server.

## GitHub Pages

1. Create a GitHub repository.
2. Upload the files in this folder.
3. Repository Settings → Pages → deploy from the main branch/root.
4. Your free address will be something like:
   `https://YOUR-USERNAME.github.io/YOUR-REPOSITORY/`

## Supabase

`supabase/schema.sql` contains the database foundation for:
- products
- size/price variants
- customer profiles
- orders
- order items
- row-level security

The current browser UI is intentionally a safe static prototype. Before taking real orders, connect Supabase Auth and database operations.

## Payment

The UI currently contains a placeholder UPI ID:
`YOUR-UPI-ID@BANK`

Replace it with your public business UPI ID and add your QR image.

Do not put Supabase service-role keys, passwords, or other secrets into GitHub.

## WhatsApp

The business number is configured as:
`9426931089`

The checkout creates a WhatsApp order message containing product code, size, price, customer information, and customization details.

## Next production steps

1. Connect Supabase Auth.
2. Move catalog data from `app.js` into Supabase.
3. Create private `payment-proofs` storage bucket.
4. Upload payment screenshot to the private bucket.
5. Save the order in Supabase.
6. Restrict customer records with RLS.
7. Add an admin role and admin dashboard.
8. Add the remaining categories: keychain and handkerchief.
9. Add a real payment gateway only when you are ready; manual UPI + proof can be used for the MVP.

## Important

This is an MVP foundation, not a finished production payment system. Test authentication, database RLS, file permissions, and order flow before accepting real customer payments.
