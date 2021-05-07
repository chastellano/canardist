const words = {
    first: [ 'community', 'randy'], // 'frothing', 'slippery' ],
    second: [ 'badger', 'bathtub'] //, 'bucket', 'pulpit' ]
}

function shuffle(arr) {
    let i, j, x;
    for (i = arr.length - 1; i; i--) {
        j = Math.floor(Math.random() * (i + 1));
        x = arr[i];
        arr[i] = arr[j];
        arr[j] = x;
    }
    return arr;
}

function createId (first, second) {
    shuffle(words.first);
    shuffle(words.second);
    let newId = [first[0], second[0]];
    return newId;
}

const roomId = createId(words.first, words.second).join('-');

// export default roomId;