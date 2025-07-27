package events

// EventBus defines the interface for a generic event bus.
type EventBus interface {
	Publish(topic string, data ...interface{}) error
	Subscribe(topic string, handler interface{}) error
	Unsubscribe(topic string, handler interface{}) error
	Close() error
}
