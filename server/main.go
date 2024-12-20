package main

import (
	"fmt"
	"log"

	"github.com/gofiber/fiber/v2"
)

func main() {
	fmt.Print("hello")
	app := fiber.New()
	app.Get("/", func(c *fiber.Ctx) error {
		return c.SendString("OK")
	})
	log.Fatal(app.Listen(":4000"))
}
