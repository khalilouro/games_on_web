class AudioManager {
    constructor() {
        this.currentMusic = null;
        this.musicVolume = 0.5;
        this.musicKey = null;
        this.playlist = ["sponge1", "sponge2", "sponge3"];
        this.currentIndex = 0;
        this.isPlaylistPlaying = false;
        this.maxDuration = 60;
    }

    startPlaylist() {
        if (this.isPlaylistPlaying) {
            this.resumeMusic();
            return;
        }
        this.isPlaylistPlaying = true;
        this.playCurrentInPlaylist();
    }

    playCurrentInPlaylist() {
        if (!this.isPlaylistPlaying) return;

        const key = this.playlist[this.currentIndex];
        this.playMusic(key, false);

        if (this.currentMusic) {
            this.currentMusic.onended = () => this.nextTrack();

            this.currentMusic.ontimeupdate = () => {
                if (this.currentMusic && this.currentMusic.currentTime >= this.maxDuration) {
                    this.nextTrack();
                }
            };
        }
    }

    nextTrack() {
        this.currentIndex = (this.currentIndex + 1) % this.playlist.length;
        this.playCurrentInPlaylist();
    }

    playMusic(key, loop = true) {
        if (this.musicKey === key && this.currentMusic && !this.currentMusic.paused) return;

        this.stopMusic();

        const path = `assets/musique/${key}.mp3`;
        this.currentMusic = new Audio(path);
        this.currentMusic.loop = loop;
        this.currentMusic.volume = this.musicVolume;
        this.musicKey = key;

        this.currentMusic.play().catch(e => {
            const retry = () => {
                if (this.currentMusic) this.currentMusic.play();
                window.removeEventListener("click", retry);
                window.removeEventListener("keydown", retry);
            };
            window.addEventListener("click", retry);
            window.addEventListener("keydown", retry);
        });
    }

    pauseMusic() {
        if (this.currentMusic && !this.currentMusic.paused) {
            this.currentMusic.pause();
        }
    }

    resumeMusic() {
        if (this.currentMusic && this.currentMusic.paused) {
            this.currentMusic.play().catch(e => console.log("Resume blocked:", e));
        } else if (!this.currentMusic && this.isPlaylistPlaying) {
            this.playCurrentInPlaylist();
        }
    }

    stopMusic() {
        if (this.currentMusic) {
            this.currentMusic.onended = null;
            this.currentMusic.ontimeupdate = null;
            this.currentMusic.pause();
            this.currentMusic.currentTime = 0;
            this.currentMusic = null;
            this.musicKey = null;
        }
    }

    playSound(key, onEnded = null) {
        const path = `assets/musique/${key}.mp3`;
        const sound = new Audio(path);
        sound.volume = 0.7;
        if (onEnded) {
            sound.onended = onEnded;
        }
        sound.play().catch(e => {
            console.log("Sound effect blocked:", e);
            if (onEnded) onEnded();
        });
    }
}

export default new AudioManager();
