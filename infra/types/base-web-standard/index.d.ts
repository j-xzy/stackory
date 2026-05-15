/* eslint-disable */
// Adapted from Cloudflare Worker Types for Web Standard Compatibility

type BufferSource = ArrayBufferView | ArrayBuffer;
type TypedArray =
	| Int8Array
	| Uint8Array
	| Uint8ClampedArray
	| Int16Array
	| Uint16Array
	| Int32Array
	| Uint32Array
	| Float32Array
	| Float64Array
	| BigInt64Array
	| BigUint64Array;

/**
 * The **`DOMException`** interface represents an abnormal event (called an **exception**) that occurs as a result of calling a method or accessing a property of a web API.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/DOMException)
 */
declare class DOMException extends Error {
	constructor(message?: string, name?: string);
	readonly message: string;
	readonly name: string;
	readonly code: number;
	static readonly INDEX_SIZE_ERR: number;
	static readonly DOMSTRING_SIZE_ERR: number;
	static readonly HIERARCHY_REQUEST_ERR: number;
	static readonly WRONG_DOCUMENT_ERR: number;
	static readonly INVALID_CHARACTER_ERR: number;
	static readonly NO_DATA_ALLOWED_ERR: number;
	static readonly NO_MODIFICATION_ALLOWED_ERR: number;
	static readonly NOT_FOUND_ERR: number;
	static readonly NOT_SUPPORTED_ERR: number;
	static readonly INUSE_ATTRIBUTE_ERR: number;
	static readonly INVALID_STATE_ERR: number;
	static readonly SYNTAX_ERR: number;
	static readonly INVALID_MODIFICATION_ERR: number;
	static readonly NAMESPACE_ERR: number;
	static readonly INVALID_ACCESS_ERR: number;
	static readonly VALIDATION_ERR: number;
	static readonly TYPE_MISMATCH_ERR: number;
	static readonly SECURITY_ERR: number;
	static readonly NETWORK_ERR: number;
	static readonly ABORT_ERR: number;
	static readonly URL_MISMATCH_ERR: number;
	static readonly QUOTA_EXCEEDED_ERR: number;
	static readonly TIMEOUT_ERR: number;
	static readonly INVALID_NODE_TYPE_ERR: number;
	static readonly DATA_CLONE_ERR: number;
}

/**
 * The **`Event`** interface represents an event which takes place on an `EventTarget`.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/Event)
 */
declare class Event {
	constructor(type: string, init?: EventInit);
	get type(): string;
	get eventPhase(): number;
	get composed(): boolean;
	get bubbles(): boolean;
	get cancelable(): boolean;
	get defaultPrevented(): boolean;
	get returnValue(): boolean;
	get currentTarget(): EventTarget | undefined;
	get target(): EventTarget | undefined;
	get srcElement(): EventTarget | undefined;
	get timeStamp(): number;
	get isTrusted(): boolean;
	get cancelBubble(): boolean;
	set cancelBubble(value: boolean);
	stopImmediatePropagation(): void;
	preventDefault(): void;
	stopPropagation(): void;
	composedPath(): EventTarget[];
	static readonly NONE: number;
	static readonly CAPTURING_PHASE: number;
	static readonly AT_TARGET: number;
	static readonly BUBBLING_PHASE: number;
}

interface EventInit {
	bubbles?: boolean;
	cancelable?: boolean;
	composed?: boolean;
}

type EventListener<EventType extends Event = Event> = (
	event: EventType,
) => void;
interface EventListenerObject<EventType extends Event = Event> {
	handleEvent(event: EventType): void;
}
type EventListenerOrEventListenerObject<EventType extends Event = Event> =
	| EventListener<EventType>
	| EventListenerObject<EventType>;

/**
 * The **`EventTarget`** interface is implemented by objects that can receive events and may have listeners for them.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/EventTarget)
 */
declare class EventTarget<
	EventMap extends Record<string, Event> = Record<string, Event>,
> {
	constructor();
	addEventListener<Type extends keyof EventMap>(
		type: Type,
		handler: EventListenerOrEventListenerObject<EventMap[Type]>,
		options?: EventTargetAddEventListenerOptions | boolean,
	): void;
	removeEventListener<Type extends keyof EventMap>(
		type: Type,
		handler: EventListenerOrEventListenerObject<EventMap[Type]>,
		options?: EventTargetEventListenerOptions | boolean,
	): void;
	dispatchEvent(event: EventMap[keyof EventMap]): boolean;
}

interface EventTargetEventListenerOptions {
	capture?: boolean;
}

interface EventTargetAddEventListenerOptions {
	capture?: boolean;
	passive?: boolean;
	once?: boolean;
	signal?: AbortSignal;
}

/**
 * The **`AbortController`** interface represents a controller object that allows you to abort one or more Web requests as and when desired.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortController)
 */
declare class AbortController {
	constructor();
	get signal(): AbortSignal;
	abort(reason?: any): void;
}

/**
 * The **`AbortSignal`** interface represents a signal object that allows you to communicate with an asynchronous operation (such as a fetch request) and abort it if required via an AbortController object.
 *
 * [MDN Reference](https://developer.mozilla.org/docs/Web/API/AbortSignal)
 */
declare abstract class AbortSignal extends EventTarget {
	static abort(reason?: any): AbortSignal;
	static timeout(delay: number): AbortSignal;
	static any(signals: AbortSignal[]): AbortSignal;
	get aborted(): boolean;
	get reason(): any;
	get onabort(): any | null;
	set onabort(value: any | null);
	throwIfAborted(): void;
}

interface Console {
	assert(condition?: boolean, ...data: any[]): void;
	clear(): void;
	count(label?: string): void;
	countReset(label?: string): void;
	debug(...data: any[]): void;
	dir(item?: any, options?: any): void;
	dirxml(...data: any[]): void;
	error(...data: any[]): void;
	group(...data: any[]): void;
	groupCollapsed(...data: any[]): void;
	groupEnd(): void;
	info(...data: any[]): void;
	log(...data: any[]): void;
	table(tabularData?: any, properties?: string[]): void;
	time(label?: string): void;
	timeEnd(label?: string): void;
	timeLog(label?: string, ...data: any[]): void;
	timeStamp(label?: string): void;
	trace(...data: any[]): void;
	warn(...data: any[]): void;
}
declare const console: Console;

declare class Blob {
	constructor(
		type?: ((ArrayBuffer | ArrayBufferView) | string | Blob)[],
		options?: BlobOptions,
	);
	get size(): number;
	get type(): string;
	slice(start?: number, end?: number, type?: string): Blob;
	arrayBuffer(): Promise<ArrayBuffer>;
	bytes(): Promise<Uint8Array>;
	text(): Promise<string>;
	stream(): ReadableStream;
}
interface BlobOptions {
	type?: string;
}

declare class File extends Blob {
	constructor(
		bits: ((ArrayBuffer | ArrayBufferView) | string | Blob)[] | undefined,
		name: string,
		options?: FileOptions,
	);
	get name(): string;
	get lastModified(): number;
}
interface FileOptions {
	type?: string;
	lastModified?: number;
}

declare abstract class Crypto {
	get subtle(): SubtleCrypto;
	getRandomValues<
		T extends
			| Int8Array
			| Uint8Array
			| Int16Array
			| Uint16Array
			| Int32Array
			| Uint32Array
			| BigInt64Array
			| BigUint64Array,
	>(buffer: T): T;
	randomUUID(): string;
	DigestStream: typeof DigestStream;
}

declare abstract class SubtleCrypto {
	encrypt(
		algorithm: string | SubtleCryptoEncryptAlgorithm,
		key: CryptoKey,
		plainText: ArrayBuffer | ArrayBufferView,
	): Promise<ArrayBuffer>;
	decrypt(
		algorithm: string | SubtleCryptoEncryptAlgorithm,
		key: CryptoKey,
		cipherText: ArrayBuffer | ArrayBufferView,
	): Promise<ArrayBuffer>;
	sign(
		algorithm: string | SubtleCryptoSignAlgorithm,
		key: CryptoKey,
		data: ArrayBuffer | ArrayBufferView,
	): Promise<ArrayBuffer>;
	verify(
		algorithm: string | SubtleCryptoSignAlgorithm,
		key: CryptoKey,
		signature: ArrayBuffer | ArrayBufferView,
		data: ArrayBuffer | ArrayBufferView,
	): Promise<boolean>;
	digest(
		algorithm: string | SubtleCryptoHashAlgorithm,
		data: ArrayBuffer | ArrayBufferView,
	): Promise<ArrayBuffer>;
	generateKey(
		algorithm: string | SubtleCryptoGenerateKeyAlgorithm,
		extractable: boolean,
		keyUsages: string[],
	): Promise<CryptoKey | CryptoKeyPair>;
	deriveKey(
		algorithm: string | SubtleCryptoDeriveKeyAlgorithm,
		baseKey: CryptoKey,
		derivedKeyAlgorithm: string | SubtleCryptoImportKeyAlgorithm,
		extractable: boolean,
		keyUsages: string[],
	): Promise<CryptoKey>;
	deriveBits(
		algorithm: string | SubtleCryptoDeriveKeyAlgorithm,
		baseKey: CryptoKey,
		length?: number | null,
	): Promise<ArrayBuffer>;
	importKey(
		format: string,
		keyData: (ArrayBuffer | ArrayBufferView) | JsonWebKey,
		algorithm: string | SubtleCryptoImportKeyAlgorithm,
		extractable: boolean,
		keyUsages: string[],
	): Promise<CryptoKey>;
	exportKey(format: string, key: CryptoKey): Promise<ArrayBuffer | JsonWebKey>;
	wrapKey(
		format: string,
		key: CryptoKey,
		wrappingKey: CryptoKey,
		wrapAlgorithm: string | SubtleCryptoEncryptAlgorithm,
	): Promise<ArrayBuffer>;
	unwrapKey(
		format: string,
		wrappedKey: ArrayBuffer | ArrayBufferView,
		unwrappingKey: CryptoKey,
		unwrapAlgorithm: string | SubtleCryptoEncryptAlgorithm,
		unwrappedKeyAlgorithm: string | SubtleCryptoImportKeyAlgorithm,
		extractable: boolean,
		keyUsages: string[],
	): Promise<CryptoKey>;
	timingSafeEqual(
		a: ArrayBuffer | ArrayBufferView,
		b: ArrayBuffer | ArrayBufferView,
	): boolean;
}

declare abstract class CryptoKey {
	readonly type: string;
	readonly extractable: boolean;
	readonly algorithm:
		| CryptoKeyKeyAlgorithm
		| CryptoKeyAesKeyAlgorithm
		| CryptoKeyHmacKeyAlgorithm
		| CryptoKeyRsaKeyAlgorithm
		| CryptoKeyEllipticKeyAlgorithm
		| CryptoKeyArbitraryKeyAlgorithm;
	readonly usages: string[];
}
interface CryptoKeyPair {
	publicKey: CryptoKey;
	privateKey: CryptoKey;
}
interface JsonWebKey {
	kty: string;
	use?: string;
	key_ops?: string[];
	alg?: string;
	ext?: boolean;
	crv?: string;
	x?: string;
	y?: string;
	d?: string;
	n?: string;
	e?: string;
	p?: string;
	q?: string;
	dp?: string;
	dq?: string;
	qi?: string;
	oth?: RsaOtherPrimesInfo[];
	k?: string;
}
interface RsaOtherPrimesInfo {
	r?: string;
	d?: string;
	t?: string;
}
interface SubtleCryptoDeriveKeyAlgorithm {
	name: string;
	salt?: ArrayBuffer | ArrayBufferView;
	iterations?: number;
	hash?: string | SubtleCryptoHashAlgorithm;
	$public?: CryptoKey;
	info?: ArrayBuffer | ArrayBufferView;
}
interface SubtleCryptoEncryptAlgorithm {
	name: string;
	iv?: ArrayBuffer | ArrayBufferView;
	additionalData?: ArrayBuffer | ArrayBufferView;
	tagLength?: number;
	counter?: ArrayBuffer | ArrayBufferView;
	length?: number;
	label?: ArrayBuffer | ArrayBufferView;
}
interface SubtleCryptoGenerateKeyAlgorithm {
	name: string;
	hash?: string | SubtleCryptoHashAlgorithm;
	modulusLength?: number;
	publicExponent?: ArrayBuffer | ArrayBufferView;
	length?: number;
	namedCurve?: string;
}
interface SubtleCryptoHashAlgorithm {
	name: string;
}
interface SubtleCryptoImportKeyAlgorithm {
	name: string;
	hash?: string | SubtleCryptoHashAlgorithm;
	length?: number;
	namedCurve?: string;
	compressed?: boolean;
}
interface SubtleCryptoSignAlgorithm {
	name: string;
	hash?: string | SubtleCryptoHashAlgorithm;
	dataLength?: number;
	saltLength?: number;
}
interface CryptoKeyKeyAlgorithm {
	name: string;
}
interface CryptoKeyAesKeyAlgorithm {
	name: string;
	length: number;
}
interface CryptoKeyHmacKeyAlgorithm {
	name: string;
	hash: CryptoKeyKeyAlgorithm;
	length: number;
}
interface CryptoKeyRsaKeyAlgorithm {
	name: string;
	modulusLength: number;
	publicExponent: ArrayBuffer | ArrayBufferView;
	hash?: CryptoKeyKeyAlgorithm;
}
interface CryptoKeyEllipticKeyAlgorithm {
	name: string;
	namedCurve: string;
}
interface CryptoKeyArbitraryKeyAlgorithm {
	name: string;
	hash?: CryptoKeyKeyAlgorithm;
	namedCurve?: string;
	length?: number;
}
declare class DigestStream extends WritableStream<
	ArrayBuffer | ArrayBufferView
> {
	constructor(algorithm: string | SubtleCryptoHashAlgorithm);
	readonly digest: Promise<ArrayBuffer>;
	get bytesWritten(): number | bigint;
}

declare class TextDecoder {
	constructor(label?: string, options?: TextDecoderConstructorOptions);
	decode(
		input?: ArrayBuffer | ArrayBufferView,
		options?: TextDecoderDecodeOptions,
	): string;
	get encoding(): string;
	get fatal(): boolean;
	get ignoreBOM(): boolean;
}
declare class TextEncoder {
	constructor();
	encode(input?: string): Uint8Array;
	encodeInto(input: string, buffer: Uint8Array): TextEncoderEncodeIntoResult;
	get encoding(): string;
}
interface TextDecoderConstructorOptions {
	fatal: boolean;
	ignoreBOM: boolean;
}
interface TextDecoderDecodeOptions {
	stream: boolean;
}
interface TextEncoderEncodeIntoResult {
	read: number;
	written: number;
}

declare class FormData {
	constructor();
	append(name: string, value: string): void;
	append(name: string, value: Blob, filename?: string): void;
	delete(name: string): void;
	get(name: string): (File | string) | null;
	getAll(name: string): (File | string)[];
	has(name: string): boolean;
	set(name: string, value: string): void;
	set(name: string, value: Blob, filename?: string): void;
	entries(): IterableIterator<[key: string, value: File | string]>;
	keys(): IterableIterator<string>;
	values(): IterableIterator<File | string>;
	forEach<This = unknown>(
		callback: (
			this: This,
			value: File | string,
			key: string,
			parent: FormData,
		) => void,
		thisArg?: This,
	): void;
	[Symbol.iterator](): IterableIterator<[key: string, value: File | string]>;
}

interface QueuingStrategy<T = any> {
	highWaterMark?: number | bigint;
	size?: (chunk: T) => number | bigint;
}
interface UnderlyingSink<W = any> {
	type?: string;
	start?: (controller: WritableStreamDefaultController) => void | Promise<void>;
	write?: (
		chunk: W,
		controller: WritableStreamDefaultController,
	) => void | Promise<void>;
	abort?: (reason: any) => void | Promise<void>;
	close?: () => void | Promise<void>;
}
interface UnderlyingByteSource {
	type: 'bytes';
	autoAllocateChunkSize?: number;
	start?: (controller: ReadableByteStreamController) => void | Promise<void>;
	pull?: (controller: ReadableByteStreamController) => void | Promise<void>;
	cancel?: (reason: any) => void | Promise<void>;
}
interface UnderlyingSource<R = any> {
	type?: '' | undefined;
	start?: (
		controller: ReadableStreamDefaultController<R>,
	) => void | Promise<void>;
	pull?: (
		controller: ReadableStreamDefaultController<R>,
	) => void | Promise<void>;
	cancel?: (reason: any) => void | Promise<void>;
	expectedLength?: number | bigint;
}
interface Transformer<I = any, O = any> {
	readableType?: string;
	writableType?: string;
	start?: (
		controller: TransformStreamDefaultController<O>,
	) => void | Promise<void>;
	transform?: (
		chunk: I,
		controller: TransformStreamDefaultController<O>,
	) => void | Promise<void>;
	flush?: (
		controller: TransformStreamDefaultController<O>,
	) => void | Promise<void>;
	cancel?: (reason: any) => void | Promise<void>;
	expectedLength?: number;
}
interface StreamPipeOptions {
	preventClose?: boolean;
	preventAbort?: boolean;
	preventCancel?: boolean;
	signal?: AbortSignal;
}
type ReadableStreamReadResult<R = any> =
	| {
			done: false;
			value: R;
	  }
	| {
			done: true;
			value?: undefined;
	  };

interface ReadableStream<R = any> {
	get locked(): boolean;
	cancel(reason?: any): Promise<void>;
	getReader(): ReadableStreamDefaultReader<R>;
	getReader(options: ReadableStreamGetReaderOptions): ReadableStreamBYOBReader;
	pipeThrough<T>(
		transform: ReadableWritablePair<T, R>,
		options?: StreamPipeOptions,
	): ReadableStream<T>;
	pipeTo(
		destination: WritableStream<R>,
		options?: StreamPipeOptions,
	): Promise<void>;
	tee(): [ReadableStream<R>, ReadableStream<R>];
	values(options?: ReadableStreamValuesOptions): AsyncIterableIterator<R>;
	[Symbol.asyncIterator](
		options?: ReadableStreamValuesOptions,
	): AsyncIterableIterator<R>;
}
declare const ReadableStream: {
	prototype: ReadableStream;
	new (
		underlyingSource: UnderlyingByteSource,
		strategy?: QueuingStrategy<Uint8Array>,
	): ReadableStream<Uint8Array>;
	new <R = any>(
		underlyingSource?: UnderlyingSource<R>,
		strategy?: QueuingStrategy<R>,
	): ReadableStream<R>;
};

declare class ReadableStreamDefaultReader<R = any> {
	constructor(stream: ReadableStream);
	get closed(): Promise<void>;
	cancel(reason?: any): Promise<void>;
	read(): Promise<ReadableStreamReadResult<R>>;
	releaseLock(): void;
}

declare class ReadableStreamBYOBReader {
	constructor(stream: ReadableStream);
	get closed(): Promise<void>;
	cancel(reason?: any): Promise<void>;
	read<T extends ArrayBufferView>(
		view: T,
	): Promise<ReadableStreamReadResult<T>>;
	releaseLock(): void;
	readAtLeast<T extends ArrayBufferView>(
		minElements: number,
		view: T,
	): Promise<ReadableStreamReadResult<T>>;
}
interface ReadableStreamBYOBReaderReadableStreamBYOBReaderReadOptions {
	min?: number;
}
interface ReadableStreamGetReaderOptions {
	mode: 'byob';
}
declare abstract class ReadableStreamBYOBRequest {
	get view(): Uint8Array | null;
	respond(bytesWritten: number): void;
	respondWithNewView(view: ArrayBuffer | ArrayBufferView): void;
	get atLeast(): number | null;
}
declare abstract class ReadableStreamDefaultController<R = any> {
	get desiredSize(): number | null;
	close(): void;
	enqueue(chunk?: R): void;
	error(reason: any): void;
}
declare abstract class ReadableByteStreamController {
	get byobRequest(): ReadableStreamBYOBRequest | null;
	get desiredSize(): number | null;
	close(): void;
	enqueue(chunk: ArrayBuffer | ArrayBufferView): void;
	error(reason: any): void;
}
declare abstract class WritableStreamDefaultController {
	get signal(): AbortSignal;
	error(reason?: any): void;
}
declare abstract class TransformStreamDefaultController<O = any> {
	get desiredSize(): number | null;
	enqueue(chunk?: O): void;
	error(reason: any): void;
	terminate(): void;
}
interface ReadableWritablePair<R = any, W = any> {
	writable: WritableStream<W>;
	readable: ReadableStream<R>;
}
declare class WritableStream<W = any> {
	constructor(
		underlyingSink?: UnderlyingSink,
		queuingStrategy?: QueuingStrategy,
	);
	get locked(): boolean;
	abort(reason?: any): Promise<void>;
	close(): Promise<void>;
	getWriter(): WritableStreamDefaultWriter<W>;
}
declare class WritableStreamDefaultWriter<W = any> {
	constructor(stream: WritableStream);
	get closed(): Promise<void>;
	get ready(): Promise<void>;
	get desiredSize(): number | null;
	abort(reason?: any): Promise<void>;
	close(): Promise<void>;
	write(chunk?: W): Promise<void>;
	releaseLock(): void;
}
declare class TransformStream<I = any, O = any> {
	constructor(
		transformer?: Transformer<I, O>,
		writableStrategy?: QueuingStrategy<I>,
		readableStrategy?: QueuingStrategy<O>,
	);
	get readable(): ReadableStream<O>;
	get writable(): WritableStream<I>;
}
declare class FixedLengthStream extends IdentityTransformStream {
	constructor(
		expectedLength: number | bigint,
		queuingStrategy?: IdentityTransformStreamQueuingStrategy,
	);
}
declare class IdentityTransformStream extends TransformStream<
	ArrayBuffer | ArrayBufferView,
	Uint8Array
> {
	constructor(queuingStrategy?: IdentityTransformStreamQueuingStrategy);
}
interface IdentityTransformStreamQueuingStrategy {
	highWaterMark?: number | bigint;
}
interface ReadableStreamValuesOptions {
	preventCancel?: boolean;
}
declare class CompressionStream extends TransformStream<
	ArrayBuffer | ArrayBufferView,
	Uint8Array
> {
	constructor(format: 'gzip' | 'deflate' | 'deflate-raw');
}
declare class DecompressionStream extends TransformStream<
	ArrayBuffer | ArrayBufferView,
	Uint8Array
> {
	constructor(format: 'gzip' | 'deflate' | 'deflate-raw');
}
declare class TextEncoderStream extends TransformStream<string, Uint8Array> {
	constructor();
	get encoding(): string;
}
declare class TextDecoderStream extends TransformStream<
	ArrayBuffer | ArrayBufferView,
	string
> {
	constructor(label?: string, options?: TextDecoderStreamTextDecoderStreamInit);
	get encoding(): string;
	get fatal(): boolean;
	get ignoreBOM(): boolean;
}
interface TextDecoderStreamTextDecoderStreamInit {
	fatal?: boolean;
	ignoreBOM?: boolean;
}
declare class ByteLengthQueuingStrategy
	implements QueuingStrategy<ArrayBufferView>
{
	constructor(init: QueuingStrategyInit);
	get highWaterMark(): number;
	get size(): (chunk?: any) => number;
}
declare class CountQueuingStrategy implements QueuingStrategy {
	constructor(init: QueuingStrategyInit);
	get highWaterMark(): number;
	get size(): (chunk?: any) => number;
}
interface QueuingStrategyInit {
	highWaterMark: number;
}

type HeadersInit =
	| Headers
	| Iterable<Iterable<string>>
	| Record<string, string>;

declare class Headers {
	constructor(init?: HeadersInit);
	get(name: string): string | null;
	getAll(name: string): string[];
	getSetCookie(): string[];
	has(name: string): boolean;
	set(name: string, value: string): void;
	append(name: string, value: string): void;
	delete(name: string): void;
	forEach<This = unknown>(
		callback: (this: This, value: string, key: string, parent: Headers) => void,
		thisArg?: This,
	): void;
	entries(): IterableIterator<[key: string, value: string]>;
	keys(): IterableIterator<string>;
	values(): IterableIterator<string>;
	[Symbol.iterator](): IterableIterator<[key: string, value: string]>;
}
type BodyInit =
	| ReadableStream<Uint8Array>
	| string
	| ArrayBuffer
	| ArrayBufferView
	| Blob
	| URLSearchParams
	| FormData;
declare abstract class Body {
	get body(): ReadableStream | null;
	get bodyUsed(): boolean;
	arrayBuffer(): Promise<ArrayBuffer>;
	bytes(): Promise<Uint8Array>;
	text(): Promise<string>;
	json<T>(): Promise<T>;
	formData(): Promise<FormData>;
	blob(): Promise<Blob>;
}
declare var Response: {
	prototype: Response;
	new (body?: BodyInit | null, init?: ResponseInit): Response;
	error(): Response;
	redirect(url: string, status?: number): Response;
	json(any: any, maybeInit?: ResponseInit | Response): Response;
};
interface Response extends Body {
	clone(): Response;
	status: number;
	statusText: string;
	headers: Headers;
	ok: boolean;
	redirected: boolean;
	url: string;
	type: 'default' | 'error';
}
interface ResponseInit {
	status?: number;
	statusText?: string;
	headers?: HeadersInit;
	encodeBody?: 'automatic' | 'manual';
}
type RequestInfo = Request | string;
declare var Request: {
	prototype: Request;
	new (input: RequestInfo | URL, init?: RequestInit): Request;
};
interface Request extends Body {
	clone(): Request;
	method: string;
	url: string;
	headers: Headers;
	redirect: string;
	signal: AbortSignal;
	integrity: string;
	keepalive: boolean;
	cache?: 'no-store' | 'no-cache';
}
interface RequestInit {
	method?: string;
	headers?: HeadersInit;
	body?: BodyInit | null;
	redirect?: string;
	cache?: 'no-store' | 'no-cache';
	integrity?: string;
	signal?: AbortSignal | null;
}

declare class URL {
	constructor(url: string | URL, base?: string | URL);
	get origin(): string;
	get href(): string;
	set href(value: string);
	get protocol(): string;
	set protocol(value: string);
	get username(): string;
	set username(value: string);
	get password(): string;
	set password(value: string);
	get host(): string;
	set host(value: string);
	get hostname(): string;
	set hostname(value: string);
	get port(): string;
	set port(value: string);
	get pathname(): string;
	set pathname(value: string);
	get search(): string;
	set search(value: string);
	get hash(): string;
	set hash(value: string);
	get searchParams(): URLSearchParams;
	toJSON(): string;
	toString(): string;
	static canParse(url: string, base?: string): boolean;
	static parse(url: string, base?: string): URL | null;
	static createObjectURL(object: File | Blob): string;
	static revokeObjectURL(object_url: string): void;
}
declare class URLSearchParams {
	constructor(
		init?: Iterable<Iterable<string>> | Record<string, string> | string,
	);
	get size(): number;
	append(name: string, value: string): void;
	delete(name: string, value?: string): void;
	get(name: string): string | null;
	getAll(name: string): string[];
	has(name: string, value?: string): boolean;
	set(name: string, value: string): void;
	sort(): void;
	entries(): IterableIterator<[key: string, value: string]>;
	keys(): IterableIterator<string>;
	values(): IterableIterator<string>;
	forEach<This = unknown>(
		callback: (
			this: This,
			value: string,
			key: string,
			parent: URLSearchParams,
		) => void,
		thisArg?: This,
	): void;
	toString(): string;
	[Symbol.iterator](): IterableIterator<[key: string, value: string]>;
}
declare class URLPattern {
	constructor(
		input?: string | URLPatternInit,
		baseURL?: string | URLPatternOptions,
		patternOptions?: URLPatternOptions,
	);
	get protocol(): string;
	get username(): string;
	get password(): string;
	get hostname(): string;
	get port(): string;
	get pathname(): string;
	get search(): string;
	get hash(): string;
	get hasRegExpGroups(): boolean;
	test(input?: string | URLPatternInit, baseURL?: string): boolean;
	exec(
		input?: string | URLPatternInit,
		baseURL?: string,
	): URLPatternResult | null;
}
interface URLPatternInit {
	protocol?: string;
	username?: string;
	password?: string;
	hostname?: string;
	port?: string;
	pathname?: string;
	search?: string;
	hash?: string;
	baseURL?: string;
}
interface URLPatternComponentResult {
	input: string;
	groups: Record<string, string>;
}
interface URLPatternResult {
	inputs: (string | URLPatternInit)[];
	protocol: URLPatternComponentResult;
	username: URLPatternComponentResult;
	password: URLPatternComponentResult;
	hostname: URLPatternComponentResult;
	port: URLPatternComponentResult;
	pathname: URLPatternComponentResult;
	search: URLPatternComponentResult;
	hash: URLPatternComponentResult;
}
interface URLPatternOptions {
	ignoreCase?: boolean;
}

declare function btoa(data: string): string;
declare function atob(data: string): string;
declare function setTimeout(
	callback: (...args: any[]) => void,
	msDelay?: number,
): number;
declare function setTimeout<Args extends any[]>(
	callback: (...args: Args) => void,
	msDelay?: number,
	...args: Args
): number;
declare function clearTimeout(timeoutId: number | null): void;
declare function setInterval(
	callback: (...args: any[]) => void,
	msDelay?: number,
): number;
declare function setInterval<Args extends any[]>(
	callback: (...args: Args) => void,
	msDelay?: number,
	...args: Args
): number;
declare function clearInterval(timeoutId: number | null): void;
declare function queueMicrotask(task: Function): void;
declare function fetch(
	input: RequestInfo | URL,
	init?: RequestInit,
): Promise<Response>;

/**
 * The Web Crypto API provides a set of low-level functions for common cryptographic tasks.
 */
declare const crypto: Crypto;
