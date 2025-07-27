package adapters

import (
	"context"
	"encoding/json"

	"github.com/polygonid/sh-id-platform/internal/core/bus"
	"github.com/polygonid/sh-id-platform/internal/pubsub"
)

// PubSubEventBusAdapter adapts pubsub.Client to bus.EventBus interface
type PubSubEventBusAdapter struct {
	pubsubClient pubsub.Client
	ctx          context.Context
}

// NewPubSubEventBusAdapter creates a new adapter
func NewPubSubEventBusAdapter(pubsubClient pubsub.Client, ctx context.Context) bus.EventBus {
	return &PubSubEventBusAdapter{
		pubsubClient: pubsubClient,
		ctx:          ctx,
	}
}

// GenericEvent is a wrapper for any event data
type GenericEvent struct {
	Data interface{} `json:"data"`
}

// Marshal implements pubsub.Event interface
func (e *GenericEvent) Marshal() (pubsub.Message, error) {
	return json.Marshal(e.Data)
}

// Unmarshal implements pubsub.Event interface
func (e *GenericEvent) Unmarshal(msg pubsub.Message) error {
	return json.Unmarshal(msg, &e.Data)
}

// Publish implements bus.EventBus interface
func (a *PubSubEventBusAdapter) Publish(topic string, data ...interface{}) error {
	if len(data) == 0 {
		return nil
	}
	
	// Use the first data item as the event payload
	event := &GenericEvent{Data: data[0]}
	return a.pubsubClient.Publish(a.ctx, topic, event)
}

// Subscribe implements bus.EventBus interface
func (a *PubSubEventBusAdapter) Subscribe(topic string, handler interface{}) error {
	// This is a simplified implementation - you may need to adapt the handler
	// based on your specific requirements
	return nil
}

// Unsubscribe implements bus.EventBus interface
func (a *PubSubEventBusAdapter) Unsubscribe(topic string, handler interface{}) error {
	// This is a simplified implementation - you may need to adapt based on requirements
	return nil
}

// Close implements bus.EventBus interface
func (a *PubSubEventBusAdapter) Close() error {
	return a.pubsubClient.Close()
}

// MockEventBusAdapter adapts pubsub.Mock to bus.EventBus interface
type MockEventBusAdapter struct {
	mock *pubsub.Mock
	ctx  context.Context
}

// NewMockEventBusAdapter creates a new mock adapter
func NewMockEventBusAdapter(ctx context.Context) bus.EventBus {
	return &MockEventBusAdapter{
		mock: pubsub.NewMock(),
		ctx:  ctx,
	}
}

// Publish implements bus.EventBus interface for mock
func (a *MockEventBusAdapter) Publish(topic string, data ...interface{}) error {
	if len(data) == 0 {
		return nil
	}
	
	// Use the first data item as the event payload
	event := &GenericEvent{Data: data[0]}
	return a.mock.Publish(a.ctx, topic, event)
}

// Subscribe implements bus.EventBus interface for mock
func (a *MockEventBusAdapter) Subscribe(topic string, handler interface{}) error {
	return nil
}

// Unsubscribe implements bus.EventBus interface for mock
func (a *MockEventBusAdapter) Unsubscribe(topic string, handler interface{}) error {
	return nil
}

// Close implements bus.EventBus interface for mock
func (a *MockEventBusAdapter) Close() error {
	return a.mock.Close()
}
