# Testing Guide

This document defines how features must be tested during development.

Agents must follow these verification steps before considering a task complete.

The goal is to ensure new code does not break existing functionality.

---

# Local Development Setup

Install dependencies

npm install

Start development server

npm run dev

Default development URL

http://localhost:3000

---

# TypeScript Verification

Before finishing any task, run

npx tsc --noEmit

There must be **no TypeScript errors**.

Agents must not introduce new type errors.

---

# Production Build Test

If major changes are made, verify the application builds successfully.

npm run build

The build must complete without errors.

---

# Product Data Testing

When modifying product-related features, verify WooCommerce API responses.

Example test endpoint

/wp-json/wc/store/v1/products

Verify the following fields exist

id  
name  
prices  
images  
stock_status  
stock_quantity  

Never assume WooCommerce field names.

---

# Product Availability Testing

Verify that stock status is interpreted correctly.

Test cases

Product stock_status = instock

Expected behavior

Add to Cart button appears

---

Product stock_status = outofstock

Expected behavior

Display text

Currently out of stock

Show Special Order button

---

Product stock_status = onbackorder

Expected behavior

Treat as Special Order

---

# Special Order Flow Testing

Steps

1. Open a product that is out of stock
2. Click Special Order
3. Special order modal should open
4. Modal must display

Delivery lead time  
Delivery fee  
Order policy  

5. Confirm order

Expected result

Item is added to cart.

---

# Delivery Fee Calculation Testing

Open special order modal.

Verify that delivery fee is calculated using

Product weight  
Product dimensions

Ensure the delivery fee displays in

KWD

Example

Special order delivery charge: 7.50 KWD

Delivery fee must **not appear on product cards**.

---

# Product Card UI Testing

Verify product cards display

Product image  
Product title  
Price  
Stock message  
Primary action button  

Verify that the grid **does not include a Learn More button**.

---

# Image Display Testing

Verify product images

Fit within containers  
Use object-fit: contain  
Are not cropped  

---

# Carousel Testing

Verify the homepage hero carousel supports

Swipe gestures on mobile  
Navigation dots  
Automatic slide transitions  

Swipe left/right must change slides.

---

# Mobile Layout Testing

Verify the site is optimized for mobile.

Check

Product grid shows 2 columns  
Cards remain readable  
Scrolling is minimized  

---

# Cart System Testing

Add a product to the cart.

Verify

Cart item appears  
Quantity updates correctly  
Total price updates  

---

# Checkout Flow Testing

Open the checkout page.

Verify

Customer details form works  
Order summary displays correctly  
Payment gateway loads  

---

# API Proxy Testing

Test shipping proxy endpoint

/api/product-shipping/{productId}

Expected response

weight  
dimensions  

Verify delivery fee calculation works using this data.

---

# Console Debugging

When debugging product data, use logs.

Example

console.log("Woo product", {
  id: product.id,
  name: product.name,
  stock_status: product.stock_status
})

Remove unnecessary logs after debugging is complete.

---

# Final Verification Checklist

Before completing a task, confirm

Application runs locally  
No TypeScript errors  
No build errors  
Product availability logic works  
Special order flow works  
Product card UI remains consistent  

If any of these fail, fix the issue before completing the task.