/// <reference path="./definitions/wildemitter.d.ts" />
/// <reference path="./definitions/RTCPeerConnection.d.ts" />
/// <reference path="./definitions/talk.d.ts" />

import WildEmitter = require("wildemitter");
import Pointer = require("./pointer");
import Shims = require("./shims");
import Util = require("./util");

class Peer extends WildEmitter {
    public config = {
        configuration: {
            iceServers: [
                {"url": "stun:stun.l.google.com:19302"},
                {"url": "stun:stun1.l.google.com:19302"},
                {"url": "stun:stun2.l.google.com:19302"},
                {"url": "stun:stun3.l.google.com:19302"},
                {"url": "stun:stun4.l.google.com:19302"}
            ]
        },
        options: {
            optional: [
                {DtlsSrtpKeyAgreement: true},
                {RtpDataChannels: true}
            ]
        },
        constraints: {
            mandatory: {
                OfferToReceiveAudio: false,
                OfferToReceiveVideo: false
            }
        },
        logger: <Logger> {
            warn: Util.noop,
            log: Util.noop
        },
        stream: new Pointer
    };
    private pc: RTCPeerConnection;
    public warn: Function;
    public log: Function;
    private channels = [];
    public id: string;

    constructor(id: string, options?: Object) {
        super();
        Util.overwrite(this.config, options);

        this.warn = this.config.logger.warn.bind(this.config.logger);
        this.log = this.config.logger.log.bind(this.config.logger);
        this.id = id;

        this.pc = new Shims.PeerConnection(this.config.configuration, this.config.options);
        this.pc.onnegotiationneeded = this.onNegotiationNeeded.bind(this);
        this.pc.oniceconnectionstatechange = this.onIceChange.bind(this);
        this.pc.ondatachannel = this.onDataChannel.bind(this);
        this.pc.onicecandidate = this.onCandidate.bind(this);
        this.pc.onicechange = this.onIceChange.bind(this);

        var stream = this.config.stream.get();
        if(stream) {
            this.log("Adding local stream to peer");
            this.pc.addStream(stream);
        }
    }

    public send(key: string, value: Object) {
        var payload = <Message> {
            peer: this.id,
            value: value,
            handler: [],
            key: key
        };
        this.emit("message", payload);
    }

    public parse(key: string, value: Object) {
        this.log("Parsing:", key, value);
        switch(key) {
            case "offer":
                this.answer(value);
                break;
            case "answer":
                this.handleAnswer(value);
                break;
            case "candidate":
                this.handleCandidate(value);
                break;
        }
    }

    public sendData(label: string, payload: any): boolean {
        var channel = this.getDataChannel(label);
        if(channel && <any> channel.readyState === "stable") {
            channel.send(JSON.stringify(payload));
            return true;
        }
        this.warn("RTCDataChannel named `%s` does not exists or it is not stable!", label);
        return false;
    }

    public getDataChannel(label: string): RTCDataChannel {
        var result = <RTCDataChannel> {};
        this.channels.some(function(channel) {
            if(channel.label === label) {
                result = channel;
                return true;
            }
            return false;
        });
        return result;
    }

    private configDataChannel(channel: RTCDataChannel) {
        channel.onclose = (event) => {
            this.log("Channel named `%s` has closed", channel.label);
            this.emit("channelClosed", event);
        };
        channel.onerror = (event) => {
            this.warn("Channel error:", event);
            this.emit("channelError", event);
        };
        channel.onopen = (event) => {
            this.log("Channel named `%s` has opened", channel.label);
            this.emit("channelOpened", event);
        };
        channel.onmessage = (event: any) => {
            var payload = JSON.parse(event.data);
            this.log("Getting (%s):", channel.label, payload);
            if(payload.key && payload.value) {
                this.parse(payload.key, payload.value);
            }
            this.emit("channelMessage", event);
        };
    }

    public addDataChannel(label: string, options?: RTCDataChannelInit): RTCDataChannel {
        var channel = this.pc.createDataChannel(label, options);
        this.configDataChannel(channel);
        this.channels.push(channel);
        return channel;
    }

    private onDataChannel(event: RTCDataChannelEvent) {
        if(event.channel) {
            this.configDataChannel(event.channel);
            this.channels.push(event.channel);
        }
    }

    private onIceChange() {
        this.log("Ice connection state has changed!");
        switch(<any> this.pc.iceConnectionState) {
            case "disconnected":
            case "failed":
                this.warn("Ice connection state is disconnected, closing the peer:", this);
                this.pc.close();
                break;
            case "completed":
                this.pc.onicecandidate = Util.noop;
                break;
        }
    }

    private onCandidate(event: RTCIceCandidateEvent) {
        if(event.candidate) {
            this.log("Found candidate:", event.candidate);
            this.send("candidate", event.candidate);
            this.pc.onicecandidate = Util.noop;
        }
    }

    private handleCandidate(ice: RTCIceCandidate) {
        this.log("Handling received candidate:", ice);
        if(ice.sdpMLineIndex && ice.candidate) {
            this.pc.addIceCandidate(new Shims.IceCandidate(ice));
        }
    }

    private onNegotiationNeeded() {
        this.log("'negotiationneeded' triggered!");
        if(<any> this.pc.signalingState === "stable") {
            this.offer();
        }
        else {
            this.warn("Signaling state is not stable!");
        }
    }

    public offer() {
        this.log("Making an offer");
        this.pc.createOffer(
            (offer) => {
                this.pc.setLocalDescription(offer,
                    () => {
                        this.send("offer", offer);
                    },
                    (error) => {
                        this.warn(error);
                    }
                );
            },
            (error) => {
                this.warn(error);
            },
            this.config.constraints
        );
    }

    public answer(offer: RTCSessionDescription) {
        this.log("Answering for an offer");
        this.pc.setRemoteDescription(new Shims.SessionDescription(offer),
            () => {
                this.pc.createAnswer(
                    (answer) => {
                        this.pc.setLocalDescription(answer,
                            () => {
                                this.send("answer", answer);
                            },
                            (error) => {
                                this.warn(error);
                            }
                        );
                    },
                    (error) => {
                        this.warn(error);
                    },
                    this.config.constraints
                );
            },
            (error) => {
                this.warn(error);
            }
        );
    }

    private handleAnswer(answer: RTCSessionDescription) {
        this.log("Handling an answer");
        this.pc.setRemoteDescription(new Shims.SessionDescription(answer),
            () => {
                this.log("Answer handled successfully");
            },
            (error) => {
                this.warn(error);
            }
        );
    }
}

export = Peer;