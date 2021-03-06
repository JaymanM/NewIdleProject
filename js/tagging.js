// The below functions were created by etnpce for me specifically to handle serialization automatically.
let tagged_classes = new Map();

const register_tag = clazz => tagged_classes.set(clazz.name, clazz)

register_tag(Decimal);

function tagging(k, v) {
    let cName = this[k]?.constructor?.name;
    return !(k == 'v' && this.hasOwnProperty ('#tag')) && tagged_classes.has(cName) ? {'#tag': cName, v} : v;
}

const untagging = (_, v) => (v?.hasOwnProperty('#tag')) ? new (tagged_classes.get(v['#tag']))(v.v) : v