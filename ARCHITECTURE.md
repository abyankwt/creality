# Project Context

This file explains the purpose, architecture, and business logic of the project.

Agents must read this file before implementing any new feature.

---

# Project Overview

This project is a **headless WooCommerce storefront** built with:

Next.js (App Router)  
TypeScript  
React  
TailwindCSS  

The backend is an existing **WordPress + WooCommerce store**.

The frontend replaces the original WordPress theme and interacts with WooCommerce using APIs.

---

# Backend System

WordPress is the source of truth.

WooCommerce manages:

Products  
Inventory  
Orders  
Customers  
Pricing  

The frontend must always respect backend data.

Never override WooCommerce business logic in the frontend.

---

# APIs Used

Two WooCommerce APIs are used.

Store API (public)

Used for frontend product browsing.

/wp-json/wc/store/v1

REST API (authenticated)

Used for secure data like shipping info.

/wp-json/wc/v3

The REST API must only be accessed through Next.js server routes.

Example

/app/api/product-shipping/[id]

---

# Special Order System

This store supports a **Special Order workflow**.

Special orders allow customers to purchase products that are not currently available in showroom inventory.

Special orders follow these rules.

Product stock_status = outofstock

→ Show "Currently out of stock"

→ Show Special Order button

Special order lead time

10–12 days

Special order confirmation modal must appear before adding the item to cart.

Customers must acknowledge the order policy.

---

# Special Order Delivery Fee

Special orders include a delivery fee.

The fee is calculated dynamically using product shipping data.

Inputs

Product weight  
Product dimensions

These values are retrieved from WooCommerce.

Formula

(weight * 0.75) + ((length * width * height) / 5000 * 0.5)

The fee must be displayed in the Special Order modal.

It must not appear on product cards.

---

# Product Availability Logic

Availability must be determined using WooCommerce stock_status.

Values

instock  
outofstock  
onbackorder

Logic

instock → Add to Cart

outofstock → Special Order

onbackorder → Special Order

Never rely solely on is_in_stock.

---

# UI Requirements

The site must prioritize **mobile usability**.

Requirements

High product density  
Minimal scrolling  
Consistent card layout  

Product cards must always include

Image  
Title  
Price  
Stock message  
Primary action button  

Do not add a "Learn More" button to product cards.

---

# Currency Format

Prices must always be displayed as

60.00 KWD

Currency must appear after the amount.

Never display

KWD 60.00

---

# Image Handling

Product images must scale uniformly.

Use

object-fit: contain

Images must not be cropped.

---

# Hero Carousel

The homepage hero banner must support

Swipe gestures on mobile  
Dot navigation  
Automatic sliding  

Users must be able to swipe left or right to change slides.

---

# Checkout System

Cart and checkout are handled by WooCommerce.

The frontend communicates with WooCommerce Store API cart endpoints.

The checkout must remain compatible with WooCommerce payment gateways.

---

# WordPress Admin

Administrators manage the store through WordPress.

They control

Product data  
Inventory  
Pricing  
Shipping data  

Frontend behavior must always respect this backend configuration.

---

# Important Development Rule

Before implementing new features

Always verify the WooCommerce API response.

Never assume field names or API structure.