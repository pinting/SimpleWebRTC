/// <reference path="../src/Definitions/socket.io-client.d.ts" />
/// <reference path="../src/Definitions/RTCPeerConnection.d.ts" />
/// <reference path="../src/Definitions/Wildemitter.d.ts" />
/// <reference path="../src/Definitions/Navigator.d.ts" />
/// <reference path="../src/Definitions/Window.d.ts" />
declare module Talk.Connection {
    class Pure extends WildEmitter {
        public handler: Handler;
        public id: string;
        public send(payload: IMessage): void;
        public get(payload: IMessage): void;
        public connectionReady(id: string): void;
        public findHandler(handler: string[]): Handler;
    }
}
declare module Talk.Connection {
    class Room extends Pure {
        public onAnswer: (peer: Peer) => void;
        public onOffer: (peer: Peer) => void;
        public type: string;
        public room: string;
        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void): void;
        public leave(): void;
        public get(payload: IMessage): void;
        public remove(id: any): boolean;
    }
}
declare module Talk.Connection.SocketIO {
    class Pure extends Connection.Pure {
        public server: io.Socket;
        constructor(handler: Handler, host?: string);
        public send(payload: IMessage): void;
    }
}
declare module Talk.Connection.SocketIO {
    class Room extends Connection.Room {
        public server: io.Socket;
        constructor(handler: Handler, host?: string, onOffer?: typeof noop, onAnswer?: any);
        public send(payload: IMessage): void;
        public join(room: string, type: string, cb?: (error: any, clients: any[]) => void): void;
        public leave(): void;
    }
}
declare module Talk {
    class Handler extends WildEmitter {
        public handlers: any[];
        public config: {};
        public peers: any[];
        public id: string;
        constructor(id?: any, options?: Object);
        private createHandler(id, H?);
        public h(id: any, H?: typeof Handler): Handler;
        public add(id: string, P?: typeof Peer): Peer;
        public get(id: string): Peer;
        public find(props?: any, cb?: any): Peer[];
    }
}
declare module Talk {
    interface ILogger {
        warn: (...args: any[]) => void;
        log: (...args: any[]) => void;
    }
}
declare module Talk {
    interface IMessage {
        handler: string[];
        peer: string;
        key: string;
        value: any;
    }
}
declare module Talk {
    var PeerConnection: any;
    var SessionDescription: any;
    var IceCandidate: any;
    var MediaStream: any;
    var URL: any;
    var userMedia: LocalMediaStream;
    var warn: typeof noop;
    var log: typeof noop;
    var sctp: any;
    var negotiations: boolean;
    function logger(obj: ILogger): void;
    function getUserMedia(audio?: boolean, video?: boolean, cb?: (error: any, stream?: MediaStream) => void): MediaStream;
    function attachMediaStream(element: HTMLVideoElement, stream: MediaStream): HTMLVideoElement;
    function dataURLtoBlob(dataURL: any): Blob;
    function safeCb(obj: any): any;
    function safeStr(obj: any): string;
    function isFunc(obj: any): boolean;
    function isEmpty(obj: any): boolean;
    function isStr(obj: any): boolean;
    function isObj(obj: any): boolean;
    function isNum(obj: any): boolean;
    function randNum(min?: number, max?: number): number;
    function randWord(length?: number): string;
    function roundUp(x: number): number;
    function uuid(): string;
    function extend(obj: Object, source: Object): Object;
    function clone(obj: any): any;
    function comp(obj1: Object, obj2: Object): boolean;
    function noop(...args: any[]): void;
}
declare module Talk.Packet.ArrayBuffer {
}
declare module Talk.Packet.String {
    class Handler extends WildEmitter {
        private threads;
        constructor(target: any);
        public send(peer: Peer, label: string, payload: string): Thread;
        private add(peer, label, id?);
        private clean(thread);
        private get(label, id);
    }
}
declare module Talk.Packet.String {
    interface IMessage {
        key: string;
        value: any;
        id: string;
    }
}
declare module Talk.Packet.String {
    interface IPacket {
        payload: string;
        length: number;
        index: number;
    }
}
declare module Talk.Packet.String {
    class Thread extends WildEmitter {
        private packets;
        private length;
        public label: string;
        public id: string;
        constructor(label: string, id?: string);
        public parse(key: string, value?: any): void;
        private send(key, value?);
        private get(i);
        public chunk(buffer: any, size?: number): void;
        public join(): void;
        public add(packet: IPacket): void;
        public ask(i: number): void;
        public clean(): void;
    }
}
declare module Talk {
    class Peer extends WildEmitter {
        public config: {
            settings: {
                iceServers: {
                    "url": string;
                }[];
            };
            constraints: {
                optional: {}[];
            };
            media: {
                mandatory: {
                    OfferToReceiveAudio: boolean;
                    OfferToReceiveVideo: boolean;
                };
            };
            serverDataChannel: boolean;
            newLocalStream: boolean;
            negotiate: boolean;
        };
        public remoteStream: MediaStream;
        public localStream: MediaStream;
        private pc;
        private channels;
        private packets;
        public id: string;
        constructor(id: string, options?: Object);
        private sendMessage(key, value);
        public parseMessage(key: string, value: any): boolean;
        private onConnectionChange();
        private onCandidate(event);
        private handleCandidate(ice);
        private negotiate();
        public offer(): void;
        private answer(offer);
        private handleAnswer(answer);
        public close(): void;
        public sendData(label: string, payload: any): void;
        private handleData(label, payload);
        private getDataChannel(label);
        private initDataChannel(channel);
        public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel;
        private onDataChannel(event);
        public addStream(stream: MediaStream): void;
        private onAddStream(event);
        private onRemoveStream(event);
        public mute(): void;
        public unmute(): void;
        public pause(): void;
        public resume(): void;
        public muteLocal(): void;
        public unmuteLocal(): void;
        public pauseLocal(): void;
        public resumeLocal(): void;
    }
}
