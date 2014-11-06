SPESIFIKASI
===========

## Event binding

## Data aware
    + Lookup data dari pants (component) yang lain
    + Data berbentuk array (seperti jQuery)

```javascript
var c = pants.get('something');
c.find() // [{...}, {...}, ...]
c.find({
    'name!like': 'farid'
}) // [ { name: 'farid hidayat' }, { name: 'farid aja' }, ... ]
c.findOne() // {...}
c.findOne({'name': 'farid hidayat'}) // { name: 'farid hidayat' }
```

## Template engine 
    + Bisa binding model ke dom, vice versa
    + Bisa logic sederhana (if, each, ref, bind, shadow)

```html
<div>
    Some description
    <template>
        <table>
            <template>
                <thead>
                    <tr>...</tr>
                </thead>
            </template>
            <template>
                <tbody>
                    <template>
                        <tr>...</tr>
                    </template>
                </tbody>
            </template>
        </table>
    </template>
</div>

<div>
    Some description
    <table>
        <thead>
            <tr>...</tr> 
        </thead>
        <tbody>
            <tr>...</tr>
            <tr>...</tr>
            <tr>...</tr>
            <tr>...</tr>
        </tbody>
    </table>
</div>
```
```html
<div>
    Some description
    <template shadow>
        <table>
            <template>
                <thead>
                    <tr>...</tr>
                </thead>
            </template>
            <template>
                <tbody>
                    <template>
                        <tr>...</tr>
                    </template>
                </tbody>
            </template>
        </table>
    </template>
</div>

<div>
    Some description
    #shadow
        <table>
            <thead>
                <tr>...</tr> 
            </thead>
            <tbody>
                <tr>...</tr>
                <tr>...</tr>
                <tr>...</tr>
                <tr>...</tr>
            </tbody>
        </table>
</div>
<div>
    Some description
    <table>
        <thead>
            <tr>...</tr> 
        </thead>
        <tbody>
            <tr>...</tr>
            <tr>...</tr>
            <tr>...</tr>
            <tr>...</tr>
        </tbody>
    </table>
</div>
```

### Template dapat dioverride

