let firstCell = null;

let cells = document.querySelectorAll(".cell");

/* ordre correct */
let correct = [
"🍎","🍌","🍇","🍓",
"🍍","🥝","🍒","🍉",
"🥥","🍑","🍋","🍐"
];

/* copie pour mélanger */
let images = [...correct];

images.sort(() => Math.random() - 0.5);

/* remplir la grille */
cells.forEach(function(cell, i){
    cell.textContent = images[i];
});

/* fonction qui vérifie si le puzzle est résolu */
function checkWin(){

    let win = true;

    cells.forEach(function(cell, i){
        if(cell.textContent !== correct[i]){
            win = false;
        }
    });

    if(win){
        alert("Bravo ! Puzzle terminé 🎉");
    }

}

/* système d'échange */
cells.forEach(function(cell){

    cell.addEventListener("click", function(){

        if(firstCell === null){
            firstCell = this;
            this.style.outline = "3px solid yellow";
        }
        else{

            let temp = firstCell.textContent;
            firstCell.textContent = this.textContent;
            this.textContent = temp;

            firstCell.style.outline = "none";
            firstCell = null;

            checkWin(); /* vérification */
        }

    });

});