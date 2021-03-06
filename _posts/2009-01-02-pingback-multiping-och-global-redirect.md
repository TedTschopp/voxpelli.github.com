---
layout: post
title: Pingback, Multiping och Global Redirect
created: 1230935716
---
Jobbade idag med att integrera olika former av pingning för denna bloggen.

Jag lade bl.a. till modulen [Pingback](http://drupal.org/project/pingback) som lägger till i Drupal stöd för Pingback-specifikationen som möjliggör för sajter att berätta för varandra när de länkar till varandra - något som bl.a. Wordpress stödjer.

[Multiping](http://drupal.org/project/multiping) blev också tillagd. Det är en modul som ska möjliggöra pingning av bl.a. [Nyligen.se](http://nyligen.se), [Twingly](http://www.twingly.com/) och Technorati.

Multiping finns ännu inte i en stabil variant så det fick bli utvecklingsversionen då det enda alternativet var Drupals inbyggda pingningsmodul som inte direkt är något imponerande alster och som därför tagits bort ur det kommande Drupal 7.

Jag gick även igenom Multipings kod eftersom att det just var en utvecklingsversion och kodningsstilen såg ut att vara sådär. Jag rensade upp den ganska så bra och kommer att skicka in en patch när jag väl testat att förändringarna fungerar - vilket är vad jag gör nu.

[Global Redirect](http://drupal.org/project/globalredirect) fick också vara med - tycker dens funktionalitet är lite av ett måste - den gör så att var sida bara går att komma åt från en URL istället för den enorma mångfald som Drupal vanligtvis serverar. Det blir mer logiskt för såväl besökare som för sökmotorer.

Slutligen - för att testa Pingback - borde inte Microsoft göra som Apple egentligen? Se [tankarna på min gamla företagsblogg](http://kodfabrik.se/blog/2008/04/13/should-microsoft-do-an-apple/
)
