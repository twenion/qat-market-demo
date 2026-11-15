# Qat — construction materials marketplace (animated concept)

"Bünövrədən dama" — from foundation to roof. A construction-materials marketplace organised by
build stage instead of by category alone. An isometric house is built as you scroll: the rebar
grid is laid and concrete poured, brick courses rise, rafters, insulation and roof sheets go on,
pipes and cables run through the walls, plaster and paint follow, then the door and the lights.
Next to every stage are the listings that stage needs, and the whole stage goes into the cart
with one click.

The estimate builder takes the house size, storeys, wall type and floor finish, redraws the
house and prices the full material list from the listings on the site.

All stores, listings, prices and orders are fictional sample data. Product photos are generated.

## What works

- Home: self-building hero house with price tags, listing ticker, scroll-built stage story,
  estimate builder, category bento, newest listings, a self-typing "post a listing" phone.
- Marketplace engine: search and filters, listing pages with consumption calculator,
  multi-seller cart and checkout (orders split per seller), posting with live preview,
  admin panel (moderation, VIP, order status, seller blocking).
- Data lives in the visitor's browser (`localStorage`); nothing is sent anywhere.

`js/house.js` draws the house (SVG, isometric, each stage driven by a 0–1 progress value).

## Run

```
python3 -m http.server 8732
```

then open `http://localhost:8732/`.
