const WebSocket = require('ws');
const fs = require('fs');
const path = require('path');
const cryptoModule = require('crypto');
const childProcess = require('child_process');
const mime = require('mime-types');
const osModule = require('os');
const ProgressBar = require('progress');

let startupArgs = {};
let appDataPath = null;
let appData = {};
let tmpDirPath = null;

let ws = null;
let connections = [];

let runningProcesses = [];

// FFmpeg container
let ffmpeg = null;
// FFmpeg library constants
const ffmpegConstants = {
	name: "FFmpeg",
	version: "5.0",
	sourceUrl: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-source.zip",
	license: "GPL Version 2",
	licenseUrl: "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html",
	downloadUrls: {
		FFmpeg: {
			win_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-win-amd64.exe",
				size: 119959040,
				hash: "4ca02c7908169391cbd95435b986b8b9296706cfe48164475c9abb88f684d6bd6fa841a971fbcc27e630fa67282aba5a57b007bb3fa0ab1f7c626d9c28cfcac9"
			},
			darwin_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-darwin-amd64",
				size: 78138880,
				hash: "50e09b80001ff2387cbc66cdc4784630e9ef47a87c27a2e0dc52fb6e776653e663547b95f87a7574c9f2c3c80d007c0ba33c3a90917db429855cf788e8794f76"
			},
			linux_i686: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-linux-i686",
				size: 50856012,
				hash: "c22abe13fada3790900ace3d01c1453862c9c87fecfa60877d11bfe41fc8805d9677a6d0db3d5def24bb9e03760b32014ffbd4b9f9d0f0dbc88161002dba51a2"
			},
			linux_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-linux-amd64",
				size: 78317376,
				hash: "ee247090c8ad936a702bc1ee214fe2aab6c6b2043703a951e2ff073db55eb0999c6824a12f60ed324b7d197fe2c0c9e713fd26d86aa74e07cf305a74552a62a1"
			},
			linux_armhf: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-linux-armhf",
				size: 30711516,
				hash: "dce6817062c787888995b7ff21e9623d0d648744db5b0b13f99ea86ac24470a551748d0608c601e0d384a6f186aef5244e49bdb70a39b0f69d99fc1e5c9fe2de"
			},
			linux_arm64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffmpeg-linux-arm64",
				size: 49628720,
				hash: "3d499d52e74803af75c4f8cc6e5f0ef8942205d0314a06edd6ccc76ee8aa80a9440a8d848f7f5c6028cc4222ea70a20530ef1bd8e635d9d36e9d67890775d115"
			}
		},
		FFprobe: {
			win_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffprobe-win-amd64.exe",
				size: 119863296,
				hash: "5b9ccb803f12b5cea98913aa8647f3b7995c9092d5e0bf95963a6df5f13f380d031ad1c2f5a0f967f6d0c4970d566492f3f9339d58abc00fb9745f9841f2861f"
			},
			darwin_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffprobe-darwin-amd64",
				size: 78073216,
				hash: "23d68f33bb53c2fd91cb69f135635cf82b50174b56556f39475146fb9c17ed7b7333817ba767509481da4c624f84a38dc11f1b94277116c0b4f15e2b12b26d97"
			},
			linux_i686: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffprobe-linux-i686",
				size: 50724300,
				hash: "1d2e67859245563e3c530e8f23b4d41d08d5d05214046655d14fe605e1d706c13cce92e102d3594207504a58f6a875dd0986aeecf0fe9307159097e5e1691fe0"
			},
			linux_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffprobe-linux-amd64",
				size: 78215520,
				hash: "93832f28a8eff04d72930aad457022bc0455f9a3909d50bd3f043fe9e444549dc2b8945a623555bd5e927d2880d0bc90b95b55dc72d078dc614fe87ed26ef4dc"
			},
			linux_armhf: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffprobe-linux-armhf",
				size: 30624652,
				hash: "edc28aa8e0eda8e2cfc64ac002f58a9cfa3c4cd929f24b85175c404c400185988b3fef5ccbf03b4a9dd3de9a7ec0cc0db67964bbc142c440c53f2f46b97638d4"
			},
			linux_arm64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/5.0/ffprobe-linux-arm64",
				size: 49543216,
				hash: "3c43d3c78cd5e2f1604f26b1052846a4e9a07c8f6efb26d6e3572c6a423bda95e0a68759d1d2dd96c11b3d62454a9753da61d0e0e49e29eb029bb29b51a53412"
			}
		}
	}
};
// MKVmerge container
let mkvmerge = null;
// MKVmerge library constants
const mkvmergeConstants = {
	name: "MKVmerge",
	version: "58.0.0",
	sourceUrl: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-source.tar.xz",
	license: "GPL Version 2",
	licenseUrl: "https://www.gnu.org/licenses/old-licenses/gpl-2.0.html",
	downloadUrls: {
		MKVmerge: {
			win_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-win-amd64.exe",
				size: 12389416,
				hash: "ff4f1b349de9e440121f7dc7de94d90f638709bd2f336e9ab28237e86febe6ab493c5b2737b1c02e40ba75378dd045daf653d6dff4df71055b05faa558e893b2"
			},
			darwin_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-darwin-amd64",
				size: 10417720,
				hash: "59c574561f6567222adda67b01fefcafba3cc03a61c8b4565789411cca9b0b43a6705857ef0f639babe119d0a63f93ff8d0974d4c90d8021c7f2d5df8e44fb4f"
			},
			darwin_arm64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-darwin-arm64",
				size: 9618112,
				hash: "a7ddb746a7f25f17ca02d38ee8f9b0f59045268e52c429070c1ca6c74c40476c82d657890d181e10ed104784ec085959876562cd218e7eefa237229855d259fe"
			},
			linux_i686: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-linux-i686",
				size: 13558924,
				hash: "ef845b83a59ea0a93ecfcd593abbb066593137e820678242d7a2010c9da1fb9925f9726eca34077bf474df8fdab4c2190fc316c153a76fac656463eb50e7a5a7"
			},
			linux_amd64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-linux-amd64",
				size: 13070840,
				hash: "b14ea5ede6019fd612985ddd864925326ad5ae5c6f4851a8701cde555d4ef499d61b67c2a382f5ef4fc313f9ad9aba17847eb3820766d0c4bcc97ff40d0c89b8"
			},
			linux_armhf: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-linux-armhf",
				size: 8573116,
				hash: "b428b35c36a2f4e43ac16369be6212724787e926041b49826e429f4c806805b25cb346c2a2d4cbe563c29294fd04985263a9786e5c933b585cc0e0ed530bdbaf"
			},
			linux_arm64: {
				url: "https://github.com/PseudoResonance/BetterDiscord-Theme/releases/download/58.0.0/mkvmerge-linux-arm64",
				size: 11509304,
				hash: "03223a4a3b6baf55d26ff582a6f79857db4fa41bad24074ee267d9f2b592e36ff337b952f03c60508888737c34fe79258bd31ea49337c04131f8e82b3cd90ae9"
			}
		}
	}
};
const librarySuffixes = {
	win_amd64: "-win-amd64.exe",
	darwin_amd64: "-darwin-amd64",
	darwin_arm64: "-darwin-arm64",
	linux_i686: "-linux-i686",
	linux_amd64: "-linux-amd64",
	linux_armhf: "-linux-armhf",
	linux_arm64: "-linux-arm64"
};

const FFmpeg = class {
	constructor(ffmpegFolder) {
		if (fs.existsSync(ffmpegFolder)) {
			this.ffmpeg = path.join(ffmpegFolder, "ffmpeg");
			this.ffprobe = path.join(ffmpegFolder, "ffprobe");
			if (process.platform == "win32") {
				this.ffmpeg += ".exe";
				this.ffprobe += ".exe";
			}
			if (!fs.existsSync(this.ffmpeg) || !fs.existsSync(this.ffprobe)) {
				this.ffmpeg = path.join(ffmpegFolder, "ffmpeg");
				switch (process.platform) {
				case "win32":
					this.ffmpeg += librarySuffixes["win_amd64"];
					break;
				case "darwin":
					this.ffmpeg += librarySuffixes["darwin_amd64"];
					break;
				default:
					switch (process.arch) {
					case "arm":
						this.ffmpeg += librarySuffixes["linux_armhf"];
						break;
					case "arm64":
						this.ffmpeg += librarySuffixes["linux_arm64"];
						break;
					case "x64":
						this.ffmpeg += librarySuffixes["linux_amd64"];
						break;
					case "ia32":
					case "x32":
					default:
						this.ffmpeg += librarySuffixes["linux_i686"];
						break;
					}
				}
				this.ffprobe = path.join(ffmpegFolder, "ffprobe");
				switch (process.platform) {
				case "win32":
					this.ffprobe += librarySuffixes["win_amd64"];
					break;
				case "darwin":
					this.ffprobe += librarySuffixes["darwin_amd64"];
					break;
				default:
					switch (process.arch) {
					case "arm":
						this.ffprobe += librarySuffixes["linux_armhf"];
						break;
					case "arm64":
						this.ffprobe += librarySuffixes["linux_arm64"];
						break;
					case "x64":
						this.ffprobe += librarySuffixes["linux_amd64"];
						break;
					case "ia32":
					case "x32":
					default:
						this.ffprobe += librarySuffixes["linux_i686"];
						break;
					}
					break;
				}
			}
			if (fs.existsSync(this.ffmpeg) && fs.existsSync(this.ffprobe)) {
				console.log('Running FFmpeg -version');
				if (startupArgs.debug) {
					console.log(childProcess.execFileSync(this.ffmpeg, ["-version"], {
							timeout: 10000
						}).toString());
				}
			} else {
				throw new Error("FFmpeg not found");
			}
		} else {
			throw new Error("FFmpeg not found");
		}
	}

	runFFmpegWithArgs(args, baseData, socketUuid) {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.ffmpeg)) {
				console.log('Running FFmpeg ' + args.join(' '));
				const process = childProcess.spawn(this.ffmpeg, args);
				osModule.setPriority(process.pid, 10);
				process.on('error', err => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'error';
					dataObj.data.error = err;
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
					Logger.err(config.info.name, err);
					reject(err);
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				process.on('exit', (code, signal) => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'exit';
					dataObj.data.code = code;
					dataObj.data.signal = signal;
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
					if (code == 0) {
						resolve(true);
					} else {
						reject();
					}
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				process.stderr.on('data', data => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'data';
					dataObj.data.data = data.toString();
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
				});
				runningProcesses.push(process);
			} else {
				throw new Error("FFmpeg not found");
			}
		});
	}

	runFFprobeWithArgs(args, baseData, socketUuid) {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.ffprobe)) {
				console.log('Running FFprobe ' + args.join(' '));
				const process = childProcess.spawn(this.ffprobe, args);
				osModule.setPriority(process.pid, 10);
				process.on('error', err => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'error';
					dataObj.data.error = err;
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
					Logger.err(config.info.name, err);
					reject(err);
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				process.on('exit', (code, signal) => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'exit';
					dataObj.data.code = code;
					dataObj.data.signal = signal;
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
					if (code == 0) {
						resolve(true);
					} else {
						reject();
					}
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				process.stderr.on('data', data => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'data';
					dataObj.data.data = data.toString();
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
				});
				runningProcesses.push(process);
			} else {
				throw new Error("FFprobe not found");
			}
		});
	}

	execFFmpegWithArgs(args) {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.ffmpeg)) {
				console.log('Running FFmpeg ' + args.join(' '));
				const process = childProcess.execFile(this.ffmpeg, args, (err, stdout, stderr) => {
					if (err) {
						console.error(stderr);
					}
					resolve({
						err: err,
						stdout: stdout,
						stderr: stderr
					});
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				osModule.setPriority(process.pid, 10);
				runningProcesses.push(process);
			} else {
				throw new Error("FFmpeg not found");
			}
		});
	}

	execFFprobeWithArgs(args) {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.ffprobe)) {
				console.log('Running FFprobe ' + args.join(' '));
				const process = childProcess.execFile(this.ffprobe, args, (err, stdout, stderr) => {
					if (err) {
						console.error(stderr);
					}
					resolve({
						err: err,
						stdout: stdout,
						stderr: stderr
					});
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				osModule.setPriority(process.pid, 10);
				runningProcesses.push(process);
			} else {
				throw new Error("FFprobe not found");
			}
		});
	}

	checkFFmpeg() {
		return fs.existsSync(this.ffmpeg);
	}

	checkFFprobe() {
		return fs.existsSync(this.ffprobe);
	}
};

const MKVmerge = class {
	constructor(mkvmergeFolder) {
		if (fs.existsSync(mkvmergeFolder)) {
			this.mkvmerge = path.join(mkvmergeFolder, "mkvmerge");
			if (process.platform == "win32") {
				this.mkvmerge += ".exe";
			}
			if (!fs.existsSync(this.mkvmerge)) {
				this.mkvmerge = path.join(mkvmergeFolder, "mkvmerge");
				switch (process.platform) {
				case "win32":
					this.mkvmerge += librarySuffixes["win_amd64"];
					break;
				case "darwin":
					switch (process.arch) {
					case "arm":
					case "arm64":
						this.mkvmerge += librarySuffixes["darwin_arm64"];
						break;
					case "x64":
					default:
						try {
							if (childProcess.execSync("sysctl -n sysctl.proc_translated").toString().startsWith("1")) {
								this.mkvmerge += librarySuffixes["darwin_arm64"];
								break;
							}
						} catch {}
						this.mkvmerge += librarySuffixes["darwin_amd64"];
						break;
					}
					break;
				default:
					switch (process.arch) {
					case "arm":
						this.mkvmerge += librarySuffixes["linux_armhf"];
						break;
					case "arm64":
						this.mkvmerge += librarySuffixes["linux_arm64"];
						break;
					case "x64":
						this.mkvmerge += librarySuffixes["linux_amd64"];
						break;
					case "ia32":
					case "x32":
					default:
						this.mkvmerge += librarySuffixes["linux_i686"];
						break;
					}
					break;
				}
			}
			if (fs.existsSync(this.mkvmerge)) {
				console.log('Running MKVmerge --version');
				if (startupArgs.debug) {
					console.log(childProcess.execFileSync(this.mkvmerge, ["--version"], {
							timeout: 10000
						}).toString());
				}
			} else {
				throw new Error("MKVmerge not found");
			}
		} else {
			throw new Error("MKVmerge not found");
		}
	}

	runWithArgs(args, baseData, socketUuid) {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.mkvmerge)) {
				console.log('Running MKVmerge ' + args.join(' '));
				const process = childProcess.spawn(this.mkvmerge, args);
				osModule.setPriority(process.pid, 10);
				process.on('error', err => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'error';
					dataObj.data.error = err;
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
					Logger.err(config.info.name, err);
					reject(err);
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				process.on('exit', (code, signal) => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'exit';
					dataObj.data.code = code;
					dataObj.data.signal = signal;
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
					if (code == 0) {
						resolve(true);
					} else {
						reject();
					}
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				process.stdout.on('data', data => {
					const dataObj = JSON.parse(JSON.stringify(baseData));
					dataObj.data.type = 'data';
					dataObj.data.data = data.toString();
					connections.find(s => s.uuid === socketUuid)?.socket.send(JSON.stringify(dataObj));
				});
				runningProcesses.push(process);
			} else {
				throw new Error("MKVmerge not found");
			}
		});
	}

	execWithArgs(args) {
		return new Promise((resolve, reject) => {
			if (fs.existsSync(this.mkvmerge)) {
				console.log('Running MKVmerge ' + args.join(' '));
				const process = childProcess.execFile(this.mkvmerge, args, (err, stdout, stderr) => {
					if (err) {
						console.error(stderr);
					}
					resolve({
						err: err,
						stdout: stdout,
						stderr: stderr
					});
					runningProcesses = runningProcesses.filter(p => p !== process);
				});
				osModule.setPriority(process.pid, 10);
				runningProcesses.push(process);
			} else {
				throw new Error("MKVmerge not found");
			}
		});
	}

	checkMKVmerge() {
		return fs.existsSync(this.mkvmerge);
	}
};

async function main() {
	startupArgs = require('yargs')(process.argv.slice(2)).option('debug', {
		alias: 'd',
		describe: 'Prints extra debug information',
		boolean: true,
	default:
		false
	}).option('port', {
		alias: 'p',
		describe: 'Sets the websocket port',
		number: true,
	default:
		38494
	}).help().argv;

	appDataPath = path.join(process.cwd(), 'data.json');

	if (!fs.existsSync(appDataPath)) {
		fs.writeFileSync(appDataPath, '{}');
	}
	try {
		appData = JSON.parse(fs.readFileSync(appDataPath));
	} catch (e) {
		console.error('Unable to read app data from [' + appDataPath + ']!');
		console.error(e.stack);
	}

	initFfmpeg();
	initMkvmerge();

	ws = new WebSocket.Server({
		port: startupArgs.port
	});
	console.log('Opening server on port: ' + startupArgs.port);

	ws.on('connection', (socket) => {
		const connectionInfo = {
			socket: socket,
			uuid: null
		};
		connections.push(connectionInfo);

		socket.on('message', async(msg) => {
			if (!connectionInfo.uuid) {
				connectionInfo.uuid = msg.toString();
				socket.send(msg.toString());
				if (startupArgs.debug)
					console.log('Client connected with UUID: ' + msg.toString());
			} else {
				const data = JSON.parse(msg.toString());
				if (data.id) {
					switch (data.data.type) {
					case 'tmpDir':
						if (!this.tmpDirPath) {
							this.tmpDirPath = path.join(osModule.tmpdir.apply(), 'filecompressor');
						}
						fs.mkdirSync(this.tmpDirPath, {
							recursive: true
						});
						if (fs.existsSync(this.tmpDirPath)) {
							try {
								fs.accessSync(this.tmpDirPath, fs.constants.R_OK | fs.constants.W_OK);
								data.data.tmpDir = this.tmpDirPath;
							} catch (e) {}
						}
						if (startupArgs.debug)
							console.log('Client requested temp directory, found: ' + this.tmpDirPath);
						socket.send(JSON.stringify(data));
						break;
					case 'mime':
						data.data.mimetype = mime.contentType(data.data.path);
						if (startupArgs.debug)
							console.log('Client requested mime type of: ' + data.data.path + ' found: ' + data.data.mimetype);
						socket.send(JSON.stringify(data));
						break;
					case 'appStatus':
						switch (data.data.appName) {
						case 'ffmpeg':
							data.data.status = ffmpeg.checkFFmpeg();
							break;
						case 'ffprobe':
							data.data.status = ffmpeg.checkFFprobe();
							break;
						case 'mkvmerge':
							data.data.status = mkvmerge.checkMKVmerge();
							break;
						}
						if (startupArgs.debug)
							console.log('Client requested status of: ' + data.data.appName + ' found: ' + data.data.status);
						socket.send(JSON.stringify(data));
						break;
					case 'runApp':
						try {
							const baseData = JSON.parse(JSON.stringify(data));
							delete baseData.data.args;
							switch (data.data.appName) {
							case 'ffmpeg':
								ffmpeg.runFFmpegWithArgs(data.data.args, baseData, connectionInfo.uuid);
								break;
							case 'ffprobe':
								ffmpeg.runFFprobeWithArgs(data.data.args, baseData, connectionInfo.uuid);
								break;
							case 'mkvmerge':
								mkvmerge.runWithArgs(data.data.args, baseData, connectionInfo.uuid);
								break;
							}
							data.data.result = true;
						} catch (e) {
							data.data.result = false;
							data.data.error = e;
						}
						connections.find(s => s.uuid === connectionInfo.uuid)?.socket.send(JSON.stringify(data));
						break;
					case 'execApp':
						try {
							switch (data.data.appName) {
							case 'ffmpeg':
								data.data.data = await ffmpeg.execFFmpegWithArgs(data.data.args);
								break;
							case 'ffprobe':
								data.data.data = await ffmpeg.execFFprobeWithArgs(data.data.args);
								break;
							case 'mkvmerge':
								data.data.data = await mkvmerge.execWithArgs(data.data.args);
								break;
							}
							data.data.result = true;
						} catch (e) {
							data.data.result = false;
							data.data.error = e;
						}
						connections.find(s => s.uuid === connectionInfo.uuid)?.socket.send(JSON.stringify(data));
						break;
					}
				}
			}
		});

		socket.on('close', () => {
			if (startupArgs.debug)
				console.log('Client connection closed with UUID: ' + connectionInfo.uuid);
			connections = connections.filter(s => s.socket !== socket);
		});
	});
}

function initFfmpeg() {
	return new Promise((resolve, reject) => {
		let ffmpegPath = path.join(process.cwd(), "libraries");
		let noFfmpeg = false;
		if (!('ffmpeg' in appData))
			appData.ffmpeg = {};
		let installedFfmpeg = appData.ffmpeg.version;
		if (installedFfmpeg && installedFfmpeg != ffmpegConstants.version) {
			noFfmpeg = true;
		} else {
			if (!ffmpeg || !ffmpeg.checkFFmpeg() || !ffmpeg.checkFFprobe()) {
				try {
					ffmpeg = new FFmpeg(ffmpegPath);
					resolve(true);
				} catch (err) {
					console.error(err);
					noFfmpeg = true;
					ffmpeg = null;
				}
			}
		}
		if (noFfmpeg) {
			console.log('Downloading ' + ffmpegConstants.name + ' ' + ffmpegConstants.version);
			console.log('The source code can be found at: ' + ffmpegConstants.sourceUrl);
			console.log(ffmpegConstants.name + ' ' + ffmpegConstants.version + ' is licensed under ' + ffmpegConstants.license + ' which can be found: ' + ffmpegConstants.licenseUrl);
			let ffmpegPromise,
			ffprobePromise;
			try {
				ffmpegPromise = downloadLibrary(ffmpegPath, ffmpegConstants.downloadUrls, "FFmpeg");
				ffmpegPromise.then(filePath => {
					try {
						fs.chmodSync(filePath, 755);
					} catch (ex) {
						console.error("Unable to download FFmpeg", ex);
						reject(ex);
					}
				}).catch(ex => {
					console.error("Unable to download FFmpeg", ex);
					reject(ex);
				});
			} catch (e) {
				console.error("Unable to download FFmpeg", e);
				reject(e);
			}
			try {
				ffprobePromise = downloadLibrary(ffmpegPath, ffmpegConstants.downloadUrls, "FFprobe");
				ffprobePromise.then(filePath => {
					try {
						fs.chmodSync(filePath, 755);
					} catch (ex) {
						console.error("Unable to download FFprobe", ex);
						reject(ex);
					}
				}).catch(ex => {
					console.error("Unable to download FFprobe", ex);
					reject(ex);
				});
			} catch (e) {
				console.error("Unable to download FFprobe", e);
				reject(e);
			}
			Promise.all([ffmpegPromise, ffprobePromise]).then(() => {
				appData.ffmpeg.version = ffmpegConstants.version;
				saveAppData();
				resolve(initFfmpeg());
			});
		}
	});
}

function initMkvmerge() {
	return new Promise((resolve, reject) => {
		let mkvmergePath = path.join(process.cwd(), "libraries");
		let noMkvmerge = false;
		if (!('mkvmerge' in appData))
			appData.mkvmerge = {};
		let installedMkvmerge = appData.mkvmerge.version;
		if (installedMkvmerge && installedMkvmerge != mkvmergeConstants.version) {
			noMkvmerge = true;
		} else {
			if (!mkvmerge || !mkvmerge.checkMKVmerge()) {
				try {
					mkvmerge = new MKVmerge(mkvmergePath);
					resolve(true);
				} catch (err) {
					console.error(err);
					noMkvmerge = true;
					mkvmerge = null;
				}
			}
		}
		if (noMkvmerge) {
			console.log('Downloading ' + mkvmergeConstants.name + ' ' + mkvmergeConstants.version);
			console.log('The source code can be found at: ' + mkvmergeConstants.sourceUrl);
			console.log(mkvmergeConstants.name + ' ' + mkvmergeConstants.version + ' is licensed under ' + mkvmergeConstants.license + ' which can be found: ' + mkvmergeConstants.licenseUrl);
			try {
				downloadLibrary(mkvmergePath, mkvmergeConstants.downloadUrls, "MKVmerge").then(filePath => {
					try {
						fs.chmodSync(filePath, 755);
						appData.mkvmerge.version = mkvmergeConstants.version;
						saveAppData();
						resolve(initMkvmerge());
					} catch (ex) {
						console.error("Unable to download MKVmerge", ex);
						reject(ex);
					}
				}).catch(ex => {
					console.error("Unable to download MKVmerge", ex);
					reject(ex);
				});
			} catch (e) {
				console.error("Unable to download MKVmerge", e);
				reject(e);
			}
		}
	});
}

async function downloadLibrary(downloadPath, downloadUrls, name) {
	fs.mkdirSync(downloadPath, {
		recursive: true
	});
	let dlInfo = "";
	switch (process.platform) {
	case "win32":
		dlInfo = downloadUrls[name].win_amd64;
		break;
	case "darwin":
		switch (process.arch) {
		case "arm":
		case "arm64":
			dlInfo = downloadUrls[name].darwin_arm64;
			if (!dlInfo)
				dlInfo = downloadUrls[name].darwin_amd64;
			break;
		case "x64":
		default:
			try {
				if (childProcess.execSync("sysctl -n sysctl.proc_translated").toString().startsWith("1")) {
					dlInfo = downloadUrls[name].darwin_arm64;
					if (!dlInfo)
						dlInfo = downloadUrls[name].darwin_amd64;
					break;
				}
			} catch {}
			dlInfo = downloadUrls[name].darwin_amd64;
			break;
		}
		break;
	default:
		switch (process.arch) {
		case "arm":
			dlInfo = downloadUrls[name].linux_armhf;
			break;
		case "arm64":
			dlInfo = downloadUrls[name].linux_arm64;
			break;
		case "x64":
			dlInfo = downloadUrls[name].linux_amd64;
			break;
		case "ia32":
		case "x32":
		default:
			dlInfo = downloadUrls[name].linux_i686;
			break;
		}
		break;
	}
	// Wait for file download to complete - .tmp appended to filename to prevent it from being run accidentally until verified
	const filePath = await downloadFile(dlInfo.url, downloadPath, name);
	// Check file size
	const fileStats = fs.statSync(filePath);
	const fileSize = fileStats ? fileStats.size : 0;
	if (fileSize !== dlInfo.size) {
		try {
			fs.rmSync(filePath);
		} catch (e) {
			console.error("Error deleting " + filePath, e);
		}
		throw new Error("Size for downloaded " + name + " does not match! Downloaded: " + fileSize + " Expected: " + dlInfo.size);
	}
	// Wait until file is hashed
	const fileHash = await hashDownloadedFile(filePath, fileSize);
	// Check file hash
	if (fileHash !== dlInfo.hash) {
		try {
			fs.rmSync(filePath);
		} catch (e) {
			console.error("Error deleting " + filePath, e);
		}
		throw new Error("Hash for downloaded " + name + " does not match! Calculated: " + fileHash + " Expected: " + dlInfo.hash);
	}
	// Rename file for use if checks pass
	const newPath = filePath.slice(0, -4);
	try {
		fs.renameSync(filePath, newPath);
	} catch (err) {
		fs.copyFileSync(filePath, newPath);
		fs.rmSync(filePath);
	}
	return newPath;
}

function hashDownloadedFile(file, fileSize) {
	return new Promise((resolve, reject) => {
		const hash = cryptoModule.createHash('sha512');
		const fileReadStream = fs.createReadStream(file);
		const bar = new ProgressBar(":token1 :percent", {
			total: fileSize
		});
		fileReadStream.on('end', () => {
			try {
				resolve(hash.digest('hex'));
			} catch (err) {
				console.error(err);
				reject();
			}
		});
		fileReadStream.on('error', (e) => {
			reject(new Error("Error while hashing " + file, {
					cause: e
				}));
		});
		fileReadStream.on('data', (chunk) => {
			bar.tick(chunk.length, {
				'token1': 'Hashing ' + file
			});
		});
		fileReadStream.pipe(hash);
	});
}

function downloadFile(downloadUrl, downloadPath, name) {
	return new Promise((resolve, reject) => {
		const https = require('https');
		const req = https.request(downloadUrl);
		req.on('response', result => {
			if (result.statusCode === 200) {
				const regexp = /filename=(.*?)(?=;|$)/gi;
				const originalFileName = regexp.exec(result.headers['content-disposition'])[1];
				const totalLength = result.headers['content-length'];
				const bar = new ProgressBar(":token1 :percent", {
					total: parseInt(totalLength)
				});
				const fileStream = fs.createWriteStream(path.join(downloadPath, originalFileName + ".tmp"));
				result.on('data', chunk => {
					bar.tick(chunk.length, {
						'token1': 'Downloading ' + name
					});
				});
				result.pipe(fileStream);
				fileStream.on('error', (e) => {
					// Handle write errors
					reject(new Error("Error while downloading " + downloadUrl + " for " + name, {
							cause: e
						}));
				});
				fileStream.on('finish', function () {
					// The file has been downloaded
					resolve(path.join(downloadPath, originalFileName + ".tmp"));
				});
			} else if (result.statusCode === 302) {
				const location = result.headers['location'];
				if (location) {
					resolve(downloadFile(location, downloadPath, name));
				} else {
					reject(new Error("Invalid file URL: " + downloadUrl + " for downloading " + name));
				}
			} else {
				reject(new Error("Server returned " + result.statusCode + " at " + downloadUrl + " for downloading " + name));
			}
		});
		req.end();
	});
}

function saveAppData() {
	fs.writeFileSync(appDataPath, JSON.stringify(appData));
}

main();
