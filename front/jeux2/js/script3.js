let firstCell = null;

let cells = document.querySelectorAll(".cell");

/* ordre correct des morceaux */
let correct = [
    "0% 0%","33.3333% 0%","66.6667% 0%","100% 0%",
    "0% 50%","33.3333% 50%","66.6667% 50%","100% 50%",
    "0% 100%","33.3333% 100%","66.6667% 100%","100% 100%"
];

/* copie pour mélanger */
let images = [...correct];

for (let i = images.length - 1; i > 0; i--) {
    let j = Math.floor(Math.random() * (i + 1));
    let temp = images[i];
    images[i] = images[j];
    images[j] = temp;
}

/* remplir la grille */
cells.forEach(function(cell, i){

    cell.style.backgroundImage = "url('asset/image/image1.jpg')";
    cell.style.backgroundSize = "400% 300%";   // 4 colonnes / 3 lignes
    cell.style.backgroundRepeat = "no-repeat";
    cell.style.backgroundPosition = images[i];
});

/* vérifier victoire */
function checkWin(){

    let win = true;

    cells.forEach(function(cell, i){
        if(cell.style.backgroundPosition !== correct[i]){
            win = false;
        }
    });

    if(win){

        let grid = document.querySelector(".grid");

        /* enlever les cases */
        grid.innerHTML = "";

        /* afficher l'image complète */
        grid.style.backgroundImage = "url('asset/image/image1.jpg')";
        grid.style.backgroundSize = "cover";
        grid.style.backgroundPosition = "center";
        grid.style.backgroundRepeat = "no-repeat";

        alert("Bravo ! Puzzle terminé 🎉");
    }

}

/* système d'échange */
cells.forEach(function(cell){

    cell.addEventListener("click", function(){

        if(firstCell === null){
            firstCell = this;
            this.style.outline = "3px solid yellow";
            this.style.outlineOffset = "-3px";
        }
        else{

            let temp = firstCell.style.backgroundPosition;
            firstCell.style.backgroundPosition = this.style.backgroundPosition;
            this.style.backgroundPosition = temp;

            firstCell.style.outline = "none";
            firstCell = null;

            checkFusion();
            checkWin();
        }

    });

});

function checkFusion(){

    /* reset */
    cells.forEach(function(cell){
        cell.style.borderRight = "1px solid black";
        cell.style.borderLeft = "1px solid black";
        cell.style.marginRight = "";
        cell.style.marginLeft = "0px";
    });

    for(let i = 0; i < cells.length; i++){

        let right = i + 1;

        if(i % 4 !== 3){

            if(
                cells[i].style.backgroundPosition === correct[i] &&
                cells[right].style.backgroundPosition === correct[right]
            ){

                /* enlever séparation */
                cells[i].style.borderRight = "none";
                cells[right].style.borderLeft = "none";

                /* manger le gap rouge */
                cells[i].style.marginRight = "-15px";

            }

        }

    }

}