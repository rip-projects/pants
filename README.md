Pants
=====

[![http://img.shields.io/bower/v/bootstrap.svg]](Image)

Pants adalah sebuah sistem komponen frontend untuk aplikasi berbasis web. Pants berdasarkan spesifikasi HTML Web Component.

HTML Web Component
- Template          `<template></template>`
- HTML Import       `<link rel="import" src="">`
- Shadow DOM        `<div>#shadow-root</div>`
- Custom element    `<my-fancy-element></my-fancy-element>`

## Instalasi menggunakan bower

Pants menggunakan bower sebagai mengatur dependencies (ketergantungan) library
yang dibutuhkan. Kamu bisa membuat direktori project kamu sebagai aplikasi bower dengan cara:

```bash
mkdir my-app
cd my-app
bower init
```

Untuk menggunakan Pants, disarankan untuk mengganti default direktori untuk meletakkan kebutuhan library dari yang biasanya berada di bower_components/ ke vendor/. Untuk mengganti direktori tersebut, silakan buat file dengan name .bowerrc lalu isi dengan baris-baris berikut ini.

```json
{
    "directory": "vendor"
}
```

Setelah itu, kamu bisa menambahkan dependency Pants dengan cara menjalankan perintah berikut ini di terminal:

```bash
bower install xinix-technology/pants --save
```

## Apa aja yang ada di Pants?



Thats it!
