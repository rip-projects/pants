# Pants

> DEPRECATED: Please use [xin](https://github.com/xinix-technology/xin)

[![License](http://img.shields.io/badge/license-MIT-red.svg?style=flat-square)](https://github.com/xinix-technology/pants/blob/master/LICENSE)
[![Bower](http://img.shields.io/bower/v/xinix-technology/pants.svg?style=flat-square)](https://github.com/xinix-technology/pants)

`pants` adalah sebuah sistem komponen frontend untuk aplikasi berbasis web. `pants` berdasarkan spesifikasi HTML Web Component.

HTML Web Component
- Template          `<template></template>`
- HTML Import       `<link rel="import" src="">`
- Shadow DOM        `<div>#shadow-root</div>`
- Custom element    `<my-fancy-element></my-fancy-element>`

## Instalasi menggunakan bower

`pants` menggunakan bower sebagai mengatur dependencies (ketergantungan) library
yang dibutuhkan. Kamu bisa membuat direktori project kamu sebagai aplikasi bower dengan cara:

```bash
mkdir my-app
cd my-app
bower init
```

Untuk menggunakan `pants`, disarankan untuk mengganti default direktori untuk meletakkan kebutuhan library dari yang biasanya berada di bower_components/ ke vendor/. Untuk mengganti direktori tersebut, silakan buat file dengan name .bowerrc lalu isi dengan baris-baris berikut ini.

```json
{
    "directory": "vendor"
}
```

Setelah itu, kamu bisa menambahkan dependency `pants` dengan cara menjalankan perintah berikut ini di terminal:

```bash
bower install xinix-technology/pants --save
```

## Apa aja yang ada di `pants`?

`pants` pada dasarnya menggunakan spec Web Component yang masih parsial diadopsi oleh browser-browser selain Chrome. Untuk memenuhi specs tersebut dibutuhkan tambahan dependency `Polymer/platform` sebagai polyfill untuk specs tersebut.

`pants` sendiri lebih sebagai framework untuk membangun komponen web dengan menggunakan beberapa konsep sebagai berikut:
- Ekspresi template yang lebih baik (seperti mustache.js)
- Pengikatan antara javascript object dan template
- Pengikatan atribut elemen antara element DOM atribut dengan javascript atribut
- Pengikatan event pada elemen dalam komponen (baik shadow dom maupun tidak).
